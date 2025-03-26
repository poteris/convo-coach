import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role key to verify user creation

test.describe('Initiate Supabase', () => {
  let supabaseSuperUser: SupabaseClient;
  let adminUser: SupabaseClient;
  const testAdminEmail = process.env.ADMIN_EMAIL!;
  const testAdminPassword = "testadminpassword";

  test.beforeAll(async () => {
    // Initialize Supabase client with service role key
    supabaseSuperUser = createClient(supabaseUrl, supabaseServiceKey);
    adminUser = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!);
  });

  test.afterAll(async () => {

    const { data: existingUsers, error: listError } = await supabaseSuperUser.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    const adminUsers = existingUsers?.users.filter(
      user => user.user_metadata?.role === 'admin' 
    ) || [];
    
    for (const user of adminUsers) {
      if (user.email !== testAdminEmail) {
        const { error: deleteError } = await supabaseSuperUser.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`Failed to delete admin user ${user.email}: ${deleteError.message}`);
        } else {
          console.log(`Removed admin privileges from user: ${user.email}`);
        }
      }
    }
  
  });

  test('Admin can be added', async ({ isMobile }) => {
    test.skip(isMobile, 'This test is not applicable for mobile browsers');


    try {
      // Create admin user
      const { data, error } = await supabaseSuperUser.auth.admin.createUser({
        email: testAdminEmail,
        password: testAdminPassword,
        user_metadata: {
          role: 'admin'
        },
        email_confirm: true
      });

      if (error) {
        throw new Error(`Failed to create admin user: ${error.message}`);
      }

      if (!data?.user) {
        throw new Error('No user data returned from creation');
      }

      // Verify user exists and has correct role
      const { data: verifyData, error: verifyError } = await supabaseSuperUser.auth.admin.getUserById(data.user.id);
      
      if (verifyError || !verifyData.user) {
        throw new Error('Failed to verify admin user existence');
      }

      expect(verifyData.user.user_metadata?.role).toBe('admin');
    } catch (err) {
      console.error('Admin creation test failed:', err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  });

  test('Admin can access persona prompts', async ({ browserName }) => {

    const { data: prompts, error } = await adminUser.from('persona_prompts').select('*');
    if (error) {
      console.error('Error fetching persona prompts:', {
        browser: browserName,
        error: error
      });
      throw new Error(`Failed to fetch persona prompts: ${error.message}`);
    }
    expect(prompts).not.toBeNull();
  });
  test('Admin can access feedback prompts', async ({ browserName }) => {
    const { data: prompts, error } = await adminUser.from('feedback_prompts').select('*');
    if (error) {
      console.error('Error fetching feedback prompts:', {
        browser: browserName,
        error: error
      });
      throw new Error(`Failed to fetch feedback prompts: ${error.message}`);
    }
    expect(prompts).not.toBeNull();
  });

    test('Admin can access system prompts', async ({ browserName }) => {
  
    const { data: prompts, error } = await adminUser.from('system_prompts').select('*');

    if (error) {
      console.error('Error fetching system prompts:', {
        browser: browserName,
        error: error
      });
      throw new Error(`Failed to fetch system prompts: ${error.message}`);
    } 
    expect(prompts).not.toBeNull();
  });

 
});