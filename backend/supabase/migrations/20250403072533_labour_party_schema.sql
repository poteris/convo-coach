-- Drop existing schema
DROP SCHEMA IF EXISTS labour_party CASCADE;
CREATE SCHEMA labour_party;
REVOKE ALL ON SCHEMA labour_party FROM PUBLIC; -- Security: revoke all privileges from public

-- Grant usage to the schema
GRANT USAGE ON SCHEMA labour_party TO anon, authenticated, service_role;

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
    major_issues TEXT NOT NULL,
    uk_party_affiliation VARCHAR(255) NOT NULL,
    personality_traits TEXT NOT NULL,
    emotional_conditions TEXT NOT NULL,
    busyness_level VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL
);

-- System prompts table
CREATE TABLE labour_party.system_prompts (
    id SERIAL PRIMARY KEY,
    scenario_id VARCHAR(255) REFERENCES labour_party.scenarios(id),
    persona_id VARCHAR(255) REFERENCES labour_party.personas(id),
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
    scenario_id VARCHAR(255) REFERENCES labour_party.scenarios(id),
    persona_id VARCHAR(255) REFERENCES labour_party.personas(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Feedback prompts table
CREATE TABLE labour_party.feedback_prompts (
    id SERIAL PRIMARY KEY,
    scenario_id VARCHAR(255) REFERENCES labour_party.scenarios(id),
    persona_id VARCHAR(255) REFERENCES labour_party.personas(id),
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

-- User Profiles table
CREATE TABLE labour_party.profiles (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- SEQUENCE GRANTS
GRANT ALL ON ALL SEQUENCES IN SCHEMA labour_party TO authenticated;

-- TABLE GRANTS
GRANT SELECT ON ALL TABLES IN SCHEMA labour_party TO "anon";
GRANT INSERT ON TABLE "labour_party"."messages" to "anon";
GRANT INSERT ON TABLE "labour_party"."conversations" to "anon";
GRANT INSERT ON TABLE "labour_party"."personas" to "anon";
GRANT UPDATE ON TABLE "labour_party"."personas" to "anon";

-- Grant access to tables for authenticated users (this is just the admin user, for now)
GRANT ALL ON ALL TABLES IN SCHEMA labour_party TO authenticated;

-- Grant access to tables for service role
GRANT SELECT ON TABLE "labour_party"."profiles" TO service_role;
GRANT INSERT ON TABLE "labour_party"."profiles" TO service_role;
GRANT UPDATE ON TABLE "labour_party"."profiles" TO service_role;

-- FUNCTIONS

-- Create revocation function, to revoke service role privileges, once the admin user has been created
CREATE OR REPLACE FUNCTION labour_party.revoke_service_privileges()
RETURNS void AS $$
BEGIN
  REVOKE INSERT, UPDATE ON TABLE labour_party.profiles FROM service_role;
  DROP POLICY IF EXISTS "service_role inserts profiles" ON labour_party.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION labour_party.revoke_service_privileges() TO service_role;

-- Admin verification function
CREATE OR REPLACE FUNCTION labour_party.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM labour_party.profiles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY 
ALTER TABLE labour_party.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.feedback_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.persona_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.scenario_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.scenario_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_party.system_prompts ENABLE ROW LEVEL SECURITY;

ALTER TABLE labour_party.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.personas FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.feedback_prompts FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.persona_prompts FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.scenario_objectives FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.scenario_prompts FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.scenarios FORCE ROW LEVEL SECURITY;
ALTER TABLE labour_party.system_prompts FORCE ROW LEVEL SECURITY;

-- Row level security policies for anonymous users
CREATE POLICY "select_conversations" ON labour_party.conversations
  FOR SELECT USING (true);

CREATE POLICY "insert_conversations" ON labour_party.conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_messages" ON labour_party.messages
  FOR SELECT USING (true);

CREATE POLICY "insert_messages" ON labour_party.messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_personas" ON labour_party.personas
  FOR SELECT USING (true); 

CREATE POLICY "insert_personas" ON labour_party.personas
  FOR INSERT WITH CHECK (true); 

CREATE POLICY "update_personas" ON labour_party.personas
  FOR UPDATE USING (true); 

CREATE POLICY "select_feedback_prompts" ON labour_party.feedback_prompts
  FOR SELECT USING (true);

CREATE POLICY "select_persona_prompts" ON labour_party.persona_prompts
  FOR SELECT USING (true);

CREATE POLICY "select_scenario_objectives" ON labour_party.scenario_objectives
  FOR SELECT USING (true);

CREATE POLICY "select_scenario_prompts" ON labour_party.scenario_prompts
  FOR SELECT USING (true);

CREATE POLICY "select_scenarios" ON labour_party.scenarios
  FOR SELECT USING (true);

CREATE POLICY "select_system_prompts" ON labour_party.system_prompts
  FOR SELECT USING (true);

-- Row level security policies for admin users
CREATE POLICY "admin_crud_system_prompts" ON labour_party.system_prompts
  FOR ALL USING (labour_party.is_admin());

CREATE POLICY "admin_crud_feedback_prompts" ON labour_party.feedback_prompts
  FOR ALL USING (labour_party.is_admin());

CREATE POLICY "admin_crud_persona_prompts" ON labour_party.persona_prompts
  FOR ALL USING (labour_party.is_admin());

CREATE POLICY "admin_crud_scenario_prompts" ON labour_party.scenario_prompts
  FOR ALL USING (labour_party.is_admin());

CREATE POLICY "Admins see all profiles" ON labour_party.profiles
  FOR SELECT USING (labour_party.is_admin()); 

CREATE POLICY "service_role sees all profiles" ON labour_party.profiles
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY "service_role inserts profiles" ON labour_party.profiles
  FOR INSERT TO service_role
  WITH CHECK (true);
