import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

// Use service role key for API operations to bypass RLS
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}
