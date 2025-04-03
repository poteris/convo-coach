  -- Drop existing tables
  DROP TABLE IF EXISTS public.messages;
  DROP TABLE IF EXISTS public.conversations;
  DROP TABLE IF EXISTS public.feedback_prompts;
  DROP TABLE IF EXISTS public.persona_prompts;
  DROP TABLE IF EXISTS public.scenario_prompts;
  DROP TABLE IF EXISTS public.scenario_objectives;
  DROP TABLE IF EXISTS public.system_prompts;
  DROP TABLE IF EXISTS public.personas;
  DROP TABLE IF EXISTS public.scenarios;

  -- Enable UUID extension if not already enabled
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



  -- Scenarios table
  CREATE TABLE scenarios (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      context TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;


  -- Scenario objectives table
  CREATE TABLE scenario_objectives (
      id SERIAL PRIMARY KEY,
      scenario_id VARCHAR(255) NOT NULL,
      objective TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
  );

  ALTER TABLE scenario_objectives ENABLE ROW LEVEL SECURITY;
  -- Personas table
  CREATE TABLE personas (
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

  ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
  -- System prompts table
  CREATE TABLE system_prompts (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

  -- Scenario prompts table
  CREATE TABLE scenario_prompts (
      id SERIAL PRIMARY KEY,
      scenario_id VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
  );

  ALTER TABLE scenario_prompts ENABLE ROW LEVEL SECURITY;

  -- Persona prompts table
  CREATE TABLE persona_prompts (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE persona_prompts ENABLE ROW LEVEL SECURITY;

  -- Feedback prompts table
  CREATE TABLE feedback_prompts (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  ALTER TABLE feedback_prompts ENABLE ROW LEVEL SECURITY;

  -- Conversations table
  CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    scenario_id VARCHAR(255) NOT NULL,
    persona_id VARCHAR(255) NOT NULL,
    system_prompt_id INTEGER DEFAULT 1,
    feedback_prompt_id INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id),
    FOREIGN KEY (persona_id) REFERENCES personas(id),
    FOREIGN KEY (feedback_prompt_id) REFERENCES feedback_prompts(id),
    FOREIGN KEY (system_prompt_id) REFERENCES system_prompts(id)
  );

  ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

  -- Messages table
  CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES public.conversations(conversation_id)
  );

  ALTER TABLE messages ENABLE ROW LEVEL SECURITY;


  -- Admin can access can do the following:
  -- 1. read, write, delete, update system_prompts
  -- 3. read, write, delete, update persona_prompts
  -- 4. read, write, delete, update feedback_prompts
  -- 5. read, write, delete, update scenario_prompts
  

  CREATE POLICY "Admin can access system_prompts" ON public.system_prompts
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin'
  );

  CREATE POLICY "Admin can access persona_prompts" ON public.persona_prompts
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

  CREATE POLICY "Admin can access feedback_prompts" ON public.feedback_prompts
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

  CREATE POLICY "Admin can access scenario_prompts" ON public.scenario_prompts
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

  CREATE POLICY "Admin can access scenario_objectives" ON public.scenario_objectives
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

  CREATE POLICY "Admin can access scenarios" ON public.scenarios
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin');

  CREATE POLICY "Admin can access personas" ON public.personas
    FOR ALL USING (auth.jwt()->'user_metadata'->>'role' = 'admin');


  CREATE POLICY "Allow public read access" ON scenarios 
  FOR SELECT TO anon USING (true);

  CREATE POLICY "Allow public read access" ON personas 
  FOR SELECT TO anon USING (true);

  CREATE POLICY "Allow public read access" ON scenario_objectives 
  FOR SELECT TO anon USING (true);

  CREATE POLICY "Allow public read access" ON system_prompts 
  FOR SELECT TO anon USING (true);

  CREATE POLICY "Allow public read access" ON scenario_prompts 
  FOR SELECT TO anon USING (true);

  CREATE POLICY "Allow public read access" ON feedback_prompts 
  FOR SELECT TO anon USING (true);


  -- NOTE: READ, WRITE AND DELETE ACCESS TO MESSAGES AND CONVERSATIONS FOR ANONYMOUS USERS IS ALLOWED
  -- THIS IS BECAUSE CURRENTLY ONLY ANONYMOUS USERS CAN ACCESS THE CHAT INTERFACE (i.e. there is no authentication)
  CREATE POLICY "Allow public read access" ON messages 
  FOR SELECT TO anon USING (true);

  CREATE POLICY "Allow public insert access" ON messages 
  FOR INSERT TO anon WITH CHECK (true);

  CREATE POLICY "Allow public delete access" ON messages 
  FOR DELETE TO anon USING (true);

  -- Drop existing policy for conversations
  DROP POLICY IF EXISTS "Allow public read access" ON conversations;

  -- Create new policies for conversations
  CREATE POLICY "Allow public read access" ON conversations 
  FOR SELECT TO anon USING (true);

  CREATE POLICY "Allow public insert access" ON conversations 
  FOR INSERT TO anon WITH CHECK (true);

  CREATE POLICY "Allow public delete access" ON conversations   
  FOR DELETE TO anon USING (true);


  -- Update grants for sequences
  GRANT USAGE ON SEQUENCE feedback_prompts_id_seq TO authenticated;
  GRANT USAGE ON SEQUENCE scenario_prompts_id_seq TO authenticated;
  GRANT USAGE ON SEQUENCE persona_prompts_id_seq TO authenticated;
  GRANT USAGE ON SEQUENCE system_prompts_id_seq TO authenticated;

