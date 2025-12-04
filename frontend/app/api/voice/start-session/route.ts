import { NextRequest, NextResponse } from "next/server";
import { createLiveKitSession } from "@/lib/server/services/livekit/agentService";
import { getConversationContext, getSystemPrompt } from "@/lib/server/db";
import { createBasePromptForMessage } from "@/lib/server/llm";
import { supabaseService as supabase } from "../../service-init";

// Simple in-memory cache to prevent duplicate agent creation during React StrictMode
const activeCreations = new Map<string, Promise<any>>();

export async function POST(req: NextRequest) {
  try {
    console.log('🎙️ Starting voice session request...');
    
    const body = await req.json();
    const { conversationId, personaId, scenarioId } = body;

    console.log('📋 Request parameters:', {
      conversationId,
      personaId,
      scenarioId
    });

    if (!conversationId || !personaId || !scenarioId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, personaId, scenarioId' },
        { status: 400 }
      );
    }

    // Create unique key for this request
    const requestKey = `${conversationId}-${personaId}-${scenarioId}`;
    
    // Use promise-based deduplication for React StrictMode
    if (activeCreations.has(requestKey)) {
      console.log('🔄 Request already in progress, waiting for existing creation...');
      try {
        const existingResult = await activeCreations.get(requestKey);
        return NextResponse.json(existingResult, { status: 200 });
      } catch (error) {
        console.error('❌ Existing creation failed, proceeding with new attempt');
        activeCreations.delete(requestKey);
      }
    }

    // ATOMIC OPERATION: Try to claim this conversation for voice processing
    console.log('🔒 Attempting to atomically claim conversation for voice processing...');
    const { data: claimResult, error: claimError } = await supabase
      .from('conversations')
      .update({ 
        is_voice_conversation: true,
        voice_metadata: { status: 'CREATING' } // Temporary placeholder to claim the conversation
      })
      .eq('conversation_id', conversationId)
      .eq('is_voice_conversation', false) // Only update if not already voice
      .select('conversation_id, is_voice_conversation, voice_metadata')
      .single();

    // If the update affected no rows, another request already claimed it
    if (!claimResult || claimError) {
      console.log('🔄 Conversation already claimed by another request, returning duplicate response...');
      
      // Return a duplicate flag immediately - the other request will handle it
      return NextResponse.json({
        isDuplicate: true,
        message: 'Another request is already creating this voice session'
      }, { status: 202 }); // 202 Accepted
    } else {
      console.log('✅ Successfully claimed conversation for voice processing');
    }

    // Create and cache the creation promise
    const creationPromise = createVoiceSession(conversationId, personaId, scenarioId);
    activeCreations.set(requestKey, creationPromise);

    try {
      const result = await creationPromise;
      activeCreations.delete(requestKey); // Clean up on success
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      activeCreations.delete(requestKey); // Clean up on error
      
      // Reset the conversation state if session creation failed
      await supabase
        .from('conversations')
        .update({ 
          is_voice_conversation: false,
          voice_metadata: {}
        })
        .eq('conversation_id', conversationId);
      
      throw error;
    }

  } catch (error) {
    console.error('Error starting voice session:', error);
    return NextResponse.json(
      { error: 'Failed to start voice session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function createVoiceSession(conversationId: string, personaId: string, scenarioId: string) {
  // 1. Verify organization has voice enabled
  console.log('👤 Fetching persona...');
  const { data: persona } = await supabase
    .from('personas')
    .select('*, organisation_id')
    .eq('id', personaId)
    .single();

  if (!persona) {
    console.error('❌ Persona not found:', personaId);
    throw new Error('Persona not found');
  }

  console.log('✅ Persona found:', {
    id: persona.id,
    name: persona.name,
    voice_id: persona.voice_id,
    voice_name: persona.voice_name,
    organisation_id: persona.organisation_id
  });

  console.log('🏢 Fetching organization settings...');
  const { data: org } = await supabase
    .from('organisations')
    .select('voice_enabled, voice_settings')
    .eq('id', persona.organisation_id || 'default')
    .single();

  console.log('🏢 Organization settings:', org);

  if (!org?.voice_enabled) {
    console.error('❌ Voice not enabled for organization');
    throw new Error('Voice not enabled for organization');
  }

  // 2. Get conversation context (scenario, persona, system prompt)
  console.log('📖 Getting conversation context...');
  const { scenario } = await getConversationContext(conversationId);
  
  console.log('📝 Getting system prompt...');
  const { data: conversation } = await supabase
    .from('conversations')
    .select('system_prompt_id')
    .eq('conversation_id', conversationId)
    .single();
  
  const systemPromptTemplate = await getSystemPrompt(conversation.system_prompt_id);
  
  // Build full system prompt with persona and scenario
  console.log('🔧 Building system prompt...');
  const systemPrompt = await createBasePromptForMessage(
    persona,
    scenario,
    systemPromptTemplate
  );

  console.log('📊 System prompt created, length:', systemPrompt.length);
  console.log('📝 System prompt preview (first 500 chars):', systemPrompt.substring(0, 500));
  console.log('📝 System prompt template ID:', conversation.system_prompt_id);
  console.log('👤 Persona details for prompt:', {
    name: persona.name,
    job: persona.job,
    segment: persona.segment,
    major_issues_in_workplace: persona.major_issues_in_workplace
  });

  // 3. Create LiveKit session
  console.log('🤖 Creating LiveKit session...');
  const livekitSession = await createLiveKitSession(
    conversationId,
    persona,
    scenario,
    systemPrompt
  );

  // 4. Update conversation with LiveKit metadata
  console.log('💾 Updating conversation with LiveKit metadata...');
  await supabase
    .from('conversations')
    .update({
      is_voice_conversation: true,
      voice_metadata: {
        provider: 'livekit',
        roomName: livekitSession.roomName,
        created_at: new Date().toISOString(),
      }
    })
    .eq('conversation_id', conversationId);

  // 5. Return connection details
  console.log('✅ Voice session started successfully with LiveKit!');
  return {
    provider: 'livekit',
    roomName: livekitSession.roomName,
    token: livekitSession.token,
    url: livekitSession.url,
    sessionId: conversationId,
    maxDurationSeconds: org.voice_settings?.max_conversation_minutes * 60 || 1800,
    persona: {
      name: persona.name,
      voice_name: persona.voice_name
    }
  };
}