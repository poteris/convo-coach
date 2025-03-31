import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { handleExistingAdminUsers } from "../next.config.mjs";
import { test, expect } from "@playwright/test";

test.describe("handleExistingAdminUsers", () => {
  let supabase: SupabaseClient;
  const TEST_EMAIL = "test@example.com";
  const DIFFERENT_EMAIL = "different@example.com";

  test.beforeAll(() => {
    supabase = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!);
  });

  test.beforeEach(async () => {
    // Clean up any existing test users before each test
    const { data: users } = await supabase.auth.admin.listUsers();
    for (const user of users?.users || []) {
      if (user.email === TEST_EMAIL || user.email === DIFFERENT_EMAIL) {
        await supabase.auth.admin.deleteUser(user.id);
      }
    }
  });

  test("should return false when no admin users exist", async () => {
    const result = await handleExistingAdminUsers(supabase, TEST_EMAIL);
    expect(result).toBe(false);
  });

  test("should return true when target admin exists", async () => {
    // Create a test admin user
    await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      user_metadata: { role: "admin" },
      email_confirm: true,
    });

    const result = await handleExistingAdminUsers(supabase, TEST_EMAIL);
    expect(result).toBe(true);
  });

  test("should remove non-target admin users", async () => {
    // Create two admin users
    await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      user_metadata: { role: "admin" },
      email_confirm: true,
    });

    await supabase.auth.admin.createUser({
      email: DIFFERENT_EMAIL,
      user_metadata: { role: "admin" },
      email_confirm: true,
    });

    // Run the function
    await handleExistingAdminUsers(supabase, TEST_EMAIL);

    // Check that only the target admin remains
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUsers = users?.users.filter((user) => user.user_metadata?.role === "admin") || [];

    expect(adminUsers.length).toBe(1);
    expect(adminUsers[0].email).toBe(TEST_EMAIL);
  });

  test.afterAll(async () => {
    await supabase.auth.admin.deleteUser(TEST_EMAIL);
    await supabase.auth.admin.deleteUser(DIFFERENT_EMAIL);
  });
});
