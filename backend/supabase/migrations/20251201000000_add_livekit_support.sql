-- Add LiveKit support to conversations
-- This migration adds a voice_provider column to track which voice provider is being used

-- Add voice_provider column (defaults to 'elevenlabs' for backward compatibility)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS voice_provider TEXT DEFAULT 'elevenlabs';

-- Add index for faster lookups of voice conversations by provider
CREATE INDEX IF NOT EXISTS idx_conversations_voice_provider 
ON conversations(voice_provider) 
WHERE is_voice_conversation = true;

-- Add comment explaining the voice_metadata flexibility
COMMENT ON COLUMN conversations.voice_metadata IS 
'Flexible JSON metadata for voice providers. 
For ElevenLabs: {agent_id, elevenlabs_conversation_id, message_count, synced_at}
For LiveKit: {provider: "livekit", roomName, created_at}';

-- Add comment for voice_provider column
COMMENT ON COLUMN conversations.voice_provider IS 
'Voice service provider: "elevenlabs" for ElevenLabs Conversational AI, "livekit" for LiveKit + Groq + ElevenLabs TTS';

