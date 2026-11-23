// Server-only module. Not marked 'use server' so these DB writes are not exposed
// to the browser as server actions.

import { supabaseService as supabase } from "../../../../../app/api/service-init";
import type { ElevenLabsTranscript } from "./agentService";

/**
 * Copy an ElevenLabs transcript into our messages table so feedback works the
 * same way as for text conversations. Safe to call more than once.
 */
export async function syncTranscriptToDatabase(
  conversationId: string,
  elevenLabsData: ElevenLabsTranscript
): Promise<number> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("voice_metadata")
    .eq("conversation_id", conversationId)
    .single();

  if (existing?.voice_metadata?.synced_at) {
    return existing.voice_metadata.message_count ?? 0;
  }

  const transcript = (elevenLabsData.transcript || []).filter((msg) => msg.message?.trim());
  if (transcript.length === 0) {
    console.warn("No transcript messages to sync for conversation:", conversationId);
    return 0;
  }

  const callDuration = elevenLabsData.metadata?.call_duration_secs ?? elevenLabsData.call_duration_secs ?? 0;
  const startedAt = Date.now() - callDuration * 1000;

  const messagesToInsert = transcript.map((msg) => ({
    conversation_id: conversationId,
    role: msg.role === "agent" ? "assistant" : "user",
    content: msg.message,
    created_at: new Date(startedAt + (msg.time_in_call_secs || 0) * 1000).toISOString(),
  }));

  const { error: messagesError } = await supabase.from("messages").insert(messagesToInsert);
  if (messagesError) {
    console.error("Error syncing transcript messages:", messagesError);
    throw new Error("Failed to sync transcript to database");
  }

  const { error: conversationError } = await supabase
    .from("conversations")
    .update({
      elevenlabs_conversation_id: elevenLabsData.conversation_id,
      voice_duration_seconds: callDuration,
      voice_metadata: {
        agent_id: elevenLabsData.agent_id,
        elevenlabs_conversation_id: elevenLabsData.conversation_id,
        message_count: messagesToInsert.length,
        synced_at: new Date().toISOString(),
      },
    })
    .eq("conversation_id", conversationId);

  if (conversationError) {
    // Messages are already saved, so don't fail the request.
    console.error("Error updating conversation metadata:", conversationError);
  }

  return messagesToInsert.length;
}

/**
 * Mark conversation as voice-based when starting
 */
export async function markConversationAsVoice(conversationId: string, elevenLabsAgentId: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({
      interaction_mode: "voice",
      is_voice_conversation: true,
      elevenlabs_agent_id: elevenLabsAgentId,
    })
    .eq("conversation_id", conversationId)
    .eq("elevenlabs_agent_id", "CREATING"); // Only update if still in CREATING state

  if (error) {
    console.error("Error marking conversation as voice:", error);
    throw new Error("Failed to update conversation mode");
  }
}
