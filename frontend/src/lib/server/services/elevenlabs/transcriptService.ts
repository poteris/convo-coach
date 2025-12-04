'use server'

import { supabaseService as supabase } from "../../../../../app/api/service-init";

interface TranscriptMessage {
  role: 'agent' | 'user';
  message: string;
  time_in_call_secs: number;
}

interface ElevenLabsTranscript {
  conversation_id: string;
  agent_id: string;
  transcript: TranscriptMessage[];
  call_duration_secs: number;
  analysis?: any;
}

/**
 * Sync conversation transcript from ElevenLabs to our messages table
 */
export async function syncTranscriptToDatabase(
  conversationId: string,
  elevenLabsData: ElevenLabsTranscript
): Promise<void> {
  console.log('📝 Starting transcript sync for conversation:', conversationId);
  console.log('📊 ElevenLabs data:', {
    conversation_id: elevenLabsData.conversation_id,
    agent_id: elevenLabsData.agent_id,
    transcript_length: elevenLabsData.transcript?.length || 0,
    call_duration: elevenLabsData.call_duration_secs
  });

  if (!elevenLabsData.transcript || elevenLabsData.transcript.length === 0) {
    console.warn('⚠️ No transcript messages to sync for conversation:', conversationId);
    return;
  }

  // Transform ElevenLabs messages to our format
  const callDuration = elevenLabsData.call_duration_secs || 0;
  const messagesToInsert = elevenLabsData.transcript.map((msg, index) => ({
    conversation_id: conversationId,
    role: msg.role === 'agent' ? 'assistant' : 'user',
    content: msg.message,
    // Use time_in_call to calculate approximate timestamp (working backwards from now)
    created_at: new Date(Date.now() - ((callDuration - (msg.time_in_call_secs || 0)) * 1000)).toISOString()
  }));

  // Insert messages in batch
  const { error: messagesError } = await supabase
    .from('messages')
    .insert(messagesToInsert);

  if (messagesError) {
    console.error('Error syncing transcript messages:', messagesError);
    throw new Error('Failed to sync transcript to database');
  }

  // Update conversation metadata
  const { error: conversationError } = await supabase
    .from('conversations')
    .update({
      voice_duration_seconds: elevenLabsData.call_duration_secs,
      voice_metadata: {
        agent_id: elevenLabsData.agent_id,
        elevenlabs_conversation_id: elevenLabsData.conversation_id,
        message_count: elevenLabsData.transcript.length,
        synced_at: new Date().toISOString()
      }
    })
    .eq('conversation_id', conversationId);

  if (conversationError) {
    console.error('Error updating conversation metadata:', conversationError);
    // Don't throw here - messages are already saved
  }

  console.log(`✅ Successfully synced ${messagesToInsert.length} messages for conversation ${conversationId}`);
  console.log('📋 Messages synced:', messagesToInsert.map(msg => `${msg.role}: ${msg.content.substring(0, 50)}...`));
}

/**
 * Mark conversation as voice-based when starting
 */
export async function markConversationAsVoice(
  conversationId: string,
  elevenLabsAgentId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({
      interaction_mode: 'voice',
      is_voice_conversation: true,
      elevenlabs_agent_id: elevenLabsAgentId
    })
    .eq('conversation_id', conversationId)
    .eq('elevenlabs_agent_id', 'CREATING'); // Only update if still in CREATING state

  if (error) {
    console.error('Error marking conversation as voice:', error);
    throw new Error('Failed to update conversation mode');
  }
  
  console.log('✅ Successfully updated conversation with agent ID:', elevenLabsAgentId);
}




