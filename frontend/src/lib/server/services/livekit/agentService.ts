'use server'

import { AccessToken } from 'livekit-server-sdk';
import { Persona } from "@/types/persona";
import { TrainingScenario } from "@/types/scenarios";

interface LiveKitSessionConfig {
  roomName: string;
  token: string;
  url: string;
}

/**
 * Create a LiveKit room and access token for voice conversation
 */
export async function createLiveKitSession(
  conversationId: string,
  persona: Persona,
  scenario: TrainingScenario,
  systemPrompt: string
): Promise<LiveKitSessionConfig> {
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    console.error('❌ LiveKit credentials missing:', {
      hasUrl: !!livekitUrl,
      hasKey: !!apiKey,
      hasSecret: !!apiSecret
    });
    throw new Error('LiveKit credentials not configured');
  }

  console.log('🎙️ Creating LiveKit session:', {
    conversationId,
    persona: persona.name,
    scenario: scenario.title,
    systemPromptLength: systemPrompt.length
  });

  // Create unique room name
  const roomName = `voice-${conversationId}`;

  // Create access token for participant
  const at = new AccessToken(apiKey, apiSecret, {
    identity: `user-${conversationId}`,
    name: 'User',
  });

  // Grant permissions
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  // Add metadata for agent to use
  at.metadata = JSON.stringify({
    personaId: persona.id,
    personaName: persona.name,
    voiceId: persona.voice_id || '21m00Tcm4TlvDq8ikWAM', // Default to Rachel
    voiceName: persona.voice_name || 'Rachel',
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    systemPrompt: systemPrompt,
  });

  const token = await at.toJwt();

  console.log('✅ LiveKit session created:', {
    roomName,
    conversationId,
    persona: persona.name,
    tokenLength: token.length
  });

  return {
    roomName,
    token,
    url: livekitUrl,
  };
}

/**
 * Get room token for reconnecting
 */
export async function getLiveKitRoomToken(
  roomName: string,
  participantIdentity: string
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials not configured');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return await at.toJwt();
}

