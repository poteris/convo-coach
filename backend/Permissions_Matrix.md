# Database Permissions Matrix

| Table Name | Anon Role (via Supabase Anon Key) | Admin Users |
|------------|-----------------|------------|
| `scenarios` | 👁️ Read | 👁️📝🔄🗑️ Read, Write, Update, Delete |
| `scenario_objectives` | 👁️ Read | 👁️📝🔄🗑️ Read, Write, Update, Delete |
| `personas` | 👁️ Read | 👁️📝🔄🗑️ Read, Write, Update, Delete |
| `system_prompts` | 👁️ Read | 👁️📝🔄🗑️ Read, Write, Update, Delete |
| `scenario_prompts` | 👁️ Read | 👁️📝🔄🗑️ Read, Write, Update, Delete |
| `persona_prompts` | 👁️ Read | 👁️📝🔄🗑️ Read, Write, Update, Delete |
| `feedback_prompts` | 👁️ Read | 👁️📝🔄🗑️ Read, Write, Update, Delete |
| `conversations` | 👁️📝🗑️ Read, Write, Delete | ❌ None |
| `messages` | 👁️📝🗑️ Read, Write, Delete | ❌ None |

## Notes:
1. **Admin users** (👑) have full CRUD permissions on configuration tables
2. **Anon Role** (👤) have:
   - Read access to all configuration tables. This is currently necessary for running the app
   - Full CRUD access to `conversations` and `messages` tables (intentional since "currently only anonymous users can access the chat interface")

**Legend:**
- 👁️ Read
- 📝 Write
- 🔄 Update
- 🗑️ Delete
- ❌ No Access


**Notes:**

* Currently we do not have authentication

---

# The Future version should like this: 
- [x] TODO: create a note about anonymous users
- [x] TODO: No Access to conversations and messages for Api_User (App_Service). 
- [x] TODO: Admin can edit all the tables except Conversations and Messages
- [x] TODO: Admin users should not be able to read messages (optional privacy feature)
- [x] TODO: Organiser Admin can only edit Scenarios 
- [x] TODO: Organiser Admin User should be added in the Future version
- [x] TODO: App_Service has acccess to annonymous user conversation


| Table | Api_User via Anon Key | Admin Users | Authenticated Users | Unauthenticated Users |
|-------|-----------------------------------|----------------------|------------------------------|--------------------------------|
| scenarios | 👁️ (Read) | 🔧 (Full Access) | ❌ (No Access) | ❌ (No Access) |
| scenario_objectives | 👁️ (Read) | 🔧 (Full Access) | ❌ (No Access) | ❌ (No Access) |
| personas | 👁️ (Read) | 🔧 (Full Access) | ❌ (No Access) | ❌ (No Access) |
| system_prompts | 👁️ (Read) | 🔧 (Full Access) | ❌ (No Access) | ❌ (No Access) |
| scenario_prompts | 👁️ (Read) | 🔧 (Full Access) | ❌ (No Access) | ❌ (No Access) |
| persona_prompts | 👁️ (Read) | 🔧 (Full Access) | ❌ (No Access) | ❌ (No Access) |
| feedback_prompts | 👁️ (Read) | 🔧 (Full Access) | ❌ (No Access) | ❌ (No Access) |
| conversations | 📋 (CRUD for Unauthenticated Users via RLS) | ❌ (No Access) | 👤 (Own Only via RLS) | 👤 (Own Only via RLS) |
| messages | 📋 (CRUD for Unauthenticated Users via RLS) | ❌ (No Access) | 👤 (Own Only via RLS) | 👤 (Own Only via RLS) |

Legend:
- 👁️ = Read-only access
- 👤 = Access only to own data via RLS policies
- 🔧 = Administrative access
- 📋 = Access limited by RLS policies
- ❌ = No access
- CRUD = Create, Read, Update, Delete

Notes:
1. App_Service via Anon Key - Has full CRUD (Create, Read, Update, Delete) access to unauthenticated user conversations and messages, but access is limited by RLS policies.
2. Admin Users - Have full administrative access to all tables except Conversations and Messages (privacy feature).
3. Authenticated Users should only be allowed to access their own conversations and messages via Row Level Security (RLS) policies.
4. Unauthenticated Users - Have the same level of access as authenticated users, limited to their own conversations and messages via RLS policies.
5. Organiser Admin Users should be added in the future version with permissions to edit only Scenarios and have read-only access to other tables (respecting the RLS)

Important things to note about the Anon Key (anon role) in Supabase
- The anon key in Supabase is a public API key that represents the anon role, which is used for unauthenticated or anonymous access to your database. It is a long-lived JSON Web Token (JWT) tied to the anon PostgreSQL role, and its permissions are defined by Row Level Security (RLS) policies
- Limited Permissions: The anon key should only have permissions explicitly granted through RLS policies to prevent unauthorized access
- Safe Exposure: It is safe to expose the anon key in client-side code when RLS is enabled because row-level permissions are enforced at the database level