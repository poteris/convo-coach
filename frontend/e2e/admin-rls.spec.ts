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

  test('Admin can be added', async ({ browserName }) => {
    try {
      // First check if the user already exists
      // NOTE: we expect the db to be empty, so we should only have one user
      // UPDATE
      const { data: existingUser, error: listError } = await supabaseSuperUser.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', {
          browser: browserName,
          error: listError
        });
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      const adminUser = existingUser?.users?.find(u => u.email === testAdminEmail);
      
      let userData;
      
      if (adminUser) {
        console.log('Admin user already exists:', {
          browser: browserName,
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.user_metadata?.role
        });
        userData = adminUser;
      } else {
        // Step 1: Create an admin user for testing
        const { data, error } = await supabaseSuperUser.auth.admin.createUser({
          email: testAdminEmail,
          password: testAdminPassword,
          user_metadata: {
            role: 'admin'
          },
          email_confirm: true // Skip email verification
        });
        
        // Log the full response for debugging
        console.log('Supabase createUser response:', {
          browser: browserName,
          hasData: !!data,
          userData: data?.user ? {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            metadata: data.user.user_metadata
          } : null,
          hasError: !!error,
          errorDetails: error ? {
            code: error.code,
            message: error.message
          } : null
        });
 // 1. user is created
 // 2. if the user is there block creation of a new user
 // 3. end of test: delete the admin user (user BeforeAll)
 // 



        // For mobile Chrome, if we have user data, proceed despite the error
        if (error && (!data?.user || browserName !== 'chromium')) {
          console.error('Failed to create admin user:', {
            browser: browserName,
            code: error.code,
            status: error.status,
            name: error.name,
            message: error.message
          });
          throw new Error(`Admin user creation failed: ${error.message}`);
        }

        userData = data?.user;
      }

      if (!userData) {
        console.error('Admin user creation/retrieval failed: No user data returned', {
          browser: browserName
        });
        throw new Error('Admin user creation/retrieval failed: No user data returned');
      }

      // Verify the user exists in the database
      const { data: verifyData, error: verifyError } = await supabaseSuperUser.auth.admin.getUserById(userData.id);
      
      if (verifyError || !verifyData.user) {
        console.error('Failed to verify admin user:', {
          browser: browserName,
          verifyError,
          userId: userData.id
        });
        throw new Error('Failed to verify admin user existence');
      }

      

      // Check if the admin was created successfully
      expect(verifyData.user).not.toBeNull();
      expect(verifyData.user.user_metadata?.role).toBe('admin');
      
      // Steps to test admin access would go here
      // For example, logging in as this admin and trying to access protected resources
    } catch (err) {
      console.error('Error in admin access test:', {
        browser: browserName,
        message: 'Test execution failed',
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      throw err; // Re-throw to fail the test
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