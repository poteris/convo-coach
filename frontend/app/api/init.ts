import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";



if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OpenAI API key");
}

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});



/**
 * Currently we are only allowing one admin user
 * Future implementations will allow multiple admin users
 * This function ensures that there is only one admin user
 * and creates a new one if there are none
 * NOTE: for this to work, the ADMIN_EMAIL environment variable must be set
 */
async function signUpAdmin() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    if (!process.env.ADMIN_EMAIL) {
      console.log('No ADMIN_EMAIL provided, skipping admin user setup');
      return;
    }
    

    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    const adminUsers = existingUsers?.users.filter(
      user => user.user_metadata?.role === 'admin' 
    ) || [];
    
    // Find if our target admin already exists
    const targetAdminExists = adminUsers.some(user => user.email === process.env.ADMIN_EMAIL);
    
    // Delete other admin users
    for (const user of adminUsers) {
      if (user.email !== process.env.ADMIN_EMAIL) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`Failed to delete admin user ${user.email}: ${deleteError.message}`);
        } else {
          console.log(`Removed admin privileges from user: ${user.email}`);
        }
      }
    }
    
    // Create admin user if it doesn't exist
    if (!targetAdminExists) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: process.env.ADMIN_EMAIL,
        user_metadata: {
          role: 'admin'
        },
         /* This confirms the email without sending verification
         on startup we expect the creator of the app to add the admin user manually
         so don't need to verify the email */
        email_confirm: true 
      });

      if (error) {
        throw new Error(`Failed to create admin user: ${error.message}`);
      }
      
      console.log('New admin user created:', data.user.email);
    } else {
      console.log(`Admin user ${process.env.ADMIN_EMAIL} already exists`);
    }
  } catch (error) {
     console.error('Error in signUpAdmin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Admin user setup failed:', errorMessage);
  }
}

signUpAdmin();