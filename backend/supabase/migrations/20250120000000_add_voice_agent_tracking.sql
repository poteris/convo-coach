-- Migration: Add voice agent tracking columns
-- Date: 2025-01-20
-- Purpose: Add columns needed for atomic voice session management

-- Add columns for voice agent tracking and atomic operations
ALTER TABLE conversations
ADD COLUMN is_voice_conversation BOOLEAN DEFAULT false,
ADD COLUMN elevenlabs_agent_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN conversations.is_voice_conversation IS 'Flag to indicate if this conversation uses voice interaction';
COMMENT ON COLUMN conversations.elevenlabs_agent_id IS 'ElevenLabs agent ID for voice conversations';

-- Create index for efficient voice conversation queries
CREATE INDEX idx_conversations_voice_flag ON conversations(is_voice_conversation) WHERE is_voice_conversation = true;
CREATE INDEX idx_conversations_agent_id ON conversations(elevenlabs_agent_id) WHERE elevenlabs_agent_id IS NOT NULL;

-- Create unique constraint to prevent duplicate voice sessions per conversation
-- This ensures atomic operations work correctly
CREATE UNIQUE INDEX idx_conversations_voice_unique ON conversations(conversation_id) 
  WHERE is_voice_conversation = true AND elevenlabs_agent_id IS NOT NULL AND elevenlabs_agent_id != 'CREATING';

