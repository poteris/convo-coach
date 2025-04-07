-- Drop existing schema
DROP SCHEMA IF EXISTS labour_party CASCADE;
CREATE SCHEMA labour_party;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Scenarios table
CREATE TABLE labour_party.scenarios (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    context TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenario objectives table
CREATE TABLE labour_party.scenario_objectives (
    id SERIAL PRIMARY KEY,
    scenario_id VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES labour_party.scenarios(id)
);

-- Personas table
CREATE TABLE labour_party.personas (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    segment VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(50) NOT NULL,
    family_status VARCHAR(255) NOT NULL,
    job VARCHAR(255) NOT NULL,
    major_issues_in_workplace TEXT NOT NULL,
    uk_party_affiliation VARCHAR(255) NOT NULL,
    personality_traits TEXT NOT NULL,
    emotional_conditions TEXT NOT NULL,
    busyness_level VARCHAR(50) NOT NULL,
    workplace VARCHAR(255) NOT NULL
);

-- System prompts table
CREATE TABLE labour_party.system_prompts (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scenario prompts table
CREATE TABLE labour_party.scenario_prompts (
    id SERIAL PRIMARY KEY,
    scenario_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES labour_party.scenarios(id)
);

-- Persona prompts table
CREATE TABLE labour_party.persona_prompts (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback prompts table
CREATE TABLE labour_party.feedback_prompts (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE labour_party.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  scenario_id VARCHAR(255) NOT NULL,
  persona_id VARCHAR(255) NOT NULL,
  system_prompt_id INTEGER DEFAULT 1,
  feedback_prompt_id INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scenario_id) REFERENCES labour_party.scenarios(id),
  FOREIGN KEY (persona_id) REFERENCES labour_party.personas(id),
  FOREIGN KEY (feedback_prompt_id) REFERENCES labour_party.feedback_prompts(id),
  FOREIGN KEY (system_prompt_id) REFERENCES labour_party.system_prompts(id)
);

-- Messages table
CREATE TABLE labour_party.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES labour_party.conversations(conversation_id)
);


-- Create policies
CREATE POLICY "Users can only access their own conversations" ON labour_party.conversations
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Grant access to tables for authenticated users
GRANT ALL ON labour_party.messages TO authenticated;
GRANT ALL ON labour_party.conversations TO authenticated;
GRANT ALL ON labour_party.feedback_prompts TO authenticated;
GRANT ALL ON labour_party.scenario_prompts TO authenticated;
GRANT ALL ON labour_party.persona_prompts TO authenticated;

-- Update grants for sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA labour_party TO authenticated;

-- Finally, grant usage to the schema
GRANT USAGE ON SCHEMA labour_party TO anon, authenticated, service_role;

grant select on table "labour_party"."conversations" to "anon";
grant select on table "labour_party"."feedback_prompts" to "anon";
grant select on table "labour_party"."messages" to "anon";
grant select on table "labour_party"."persona_prompts" to "anon";
grant select on table "labour_party"."personas" to "anon";
grant select on table "labour_party"."scenario_objectives" to "anon";
grant select on table "labour_party"."scenario_prompts" to "anon";
grant select on table "labour_party"."scenarios" to "anon";
grant select on table "labour_party"."system_prompts" to "anon";

grant insert on table "labour_party"."messages" to "anon";
grant insert on table "labour_party"."conversations" to "anon";
grant insert on table "labour_party"."personas" to "anon";
grant update on table "labour_party"."personas" to "anon";

ALTER TABLE labour_party.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_conversations" ON labour_party.conversations
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_conversations" ON labour_party.conversations
  FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE labour_party.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_messages" ON labour_party.messages
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_messages" ON labour_party.messages
  FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE labour_party.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_personas" ON labour_party.personas
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_personas" ON labour_party.personas
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_personas" ON labour_party.personas
  FOR UPDATE TO anon WITH CHECK (true);

ALTER TABLE labour_party.feedback_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_feedback_prompts" ON labour_party.feedback_prompts
  FOR SELECT TO anon USING (true);

ALTER TABLE labour_party.persona_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_persona_prompts" ON labour_party.persona_prompts
  FOR SELECT TO anon USING (true);


ALTER TABLE labour_party.scenario_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_scenario_objectives" ON labour_party.scenario_objectives
  FOR SELECT TO anon USING (true);

ALTER TABLE labour_party.scenario_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_scenario_prompts" ON labour_party.scenario_prompts
  FOR SELECT TO anon USING (true);

ALTER TABLE labour_party.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_scenarios" ON labour_party.scenarios
  FOR SELECT TO anon USING (true);

ALTER TABLE labour_party.system_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_system_prompts" ON labour_party.system_prompts
  FOR SELECT TO anon USING (true);
