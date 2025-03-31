/** @type {import('next').NextConfig} */

import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { createClient } from '@supabase/supabase-js';


async function handleExistingAdminUsers(supabase, targetEmail) {
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }
  
  const adminUsers = existingUsers?.users.filter(
    user => user.user_metadata?.role === 'admin' 
  ) || [];
  
  const targetAdminExists = adminUsers.some(user => user.email === targetEmail);
  
  for (const user of adminUsers) {
    if (user.email !== targetEmail) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Failed to delete admin user ${user.email}: ${deleteError.message}`);
      } else {
        console.log(`Removed admin privileges from user: ${user.email}`);
      }
    }
  }
  
  return targetAdminExists;
}

async function createNewAdminUser(supabase, email) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    user_metadata: { role: 'admin' },
    email_confirm: true
  });

  if (error) {
    throw new Error(`Failed to create admin user: ${error.message}`);
  }
  
  console.log('New admin user created:', data.user.email);
}

/**
 * Currently we are only allowing one admin user
 * Future implementations will allow multiple admin users
 * This function ensures that there is only one admin user
 * and creates a new one if there are none
 * NOTE: for this to work, the ADMIN_EMAIL environment variable must be set
 */
export async function signUpAdmin() {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!process.env.ADMIN_EMAIL) {
      console.log('No ADMIN_EMAIL provided, skipping admin user setup');
      return;
    }

    const targetAdminExists = await handleExistingAdminUsers(supabase, process.env.ADMIN_EMAIL);
    
    if (!targetAdminExists) {
      await createNewAdminUser(supabase, process.env.ADMIN_EMAIL);
    } else {
      console.log(`Admin user ${process.env.ADMIN_EMAIL} already exists`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Admin user setup failed:', errorMessage);
  }
}

signUpAdmin();


const nextConfig = {
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  compiler: {
    reactRemoveProperties: false
  }
};

export default nextConfig;
