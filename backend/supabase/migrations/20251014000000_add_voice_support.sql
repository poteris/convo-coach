-- Migration: Add voice support for ElevenLabs integration
-- Date: 2025-10-14

-- 1. Add voice settings to organisations table
ALTER TABLE organisations 
ADD COLUMN voice_enabled BOOLEAN DEFAULT false,
ADD COLUMN voice_settings JSONB DEFAULT '{
  "max_conversation_minutes": 30,
  "monthly_minute_limit": 500
}'::jsonb;

COMMENT ON COLUMN organisations.voice_enabled IS 'Whether voice chat is enabled for this organization';
COMMENT ON COLUMN organisations.voice_settings IS 'Voice feature settings including limits';

-- 2. Add voice characteristics to personas table
ALTER TABLE personas
ADD COLUMN voice_id VARCHAR(255),
ADD COLUMN voice_name VARCHAR(100),
ADD COLUMN voice_accent VARCHAR(50);

COMMENT ON COLUMN personas.voice_id IS 'ElevenLabs voice ID for this persona';
COMMENT ON COLUMN personas.voice_name IS 'Human-readable voice name';
COMMENT ON COLUMN personas.voice_accent IS 'Accent/dialect for voice (e.g., Scottish, Welsh)';

-- Create index for voice lookups
CREATE INDEX idx_personas_voice_id ON personas(voice_id) WHERE voice_id IS NOT NULL;

-- 3. Add voice metadata to conversations table
ALTER TABLE conversations
ADD COLUMN interaction_mode VARCHAR(10) DEFAULT 'text' CHECK (interaction_mode IN ('text', 'voice')),
ADD COLUMN elevenlabs_conversation_id TEXT,
ADD COLUMN elevenlabs_agent_id TEXT,
ADD COLUMN is_voice_conversation BOOLEAN DEFAULT false,
ADD COLUMN voice_duration_seconds INTEGER DEFAULT 0,
ADD COLUMN voice_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN conversations.interaction_mode IS 'Whether conversation was text or voice based';
COMMENT ON COLUMN conversations.elevenlabs_conversation_id IS 'ElevenLabs conversation/agent ID for tracking';
COMMENT ON COLUMN conversations.elevenlabs_agent_id IS 'ElevenLabs agent ID for voice conversations';
COMMENT ON COLUMN conversations.is_voice_conversation IS 'Flag to indicate if this conversation uses voice interaction';
COMMENT ON COLUMN conversations.voice_duration_seconds IS 'Total duration of voice conversation in seconds';
COMMENT ON COLUMN conversations.voice_metadata IS 'Additional voice session metadata';

-- Create indexes for analytics queries
CREATE INDEX idx_conversations_interaction_mode ON conversations(interaction_mode);
CREATE INDEX idx_conversations_elevenlabs_id ON conversations(elevenlabs_conversation_id) 
  WHERE elevenlabs_conversation_id IS NOT NULL;
CREATE INDEX idx_conversations_voice_flag ON conversations(is_voice_conversation) WHERE is_voice_conversation = true;
CREATE INDEX idx_conversations_agent_id ON conversations(elevenlabs_agent_id) WHERE elevenlabs_agent_id IS NOT NULL;

-- Create unique constraint to prevent duplicate voice sessions per conversation
-- This ensures atomic operations work correctly
CREATE UNIQUE INDEX idx_conversations_voice_unique ON conversations(conversation_id) 
  WHERE is_voice_conversation = true AND elevenlabs_agent_id IS NOT NULL AND elevenlabs_agent_id != 'CREATING';




