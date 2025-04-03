# Database Schema Permissions Matrix

| Table | Anonymous Users | Authenticated Users | Admin Users |
|-------|----------------|---------------------|-------------|
| scenarios | 👁️ Read | 👁️ Read (via anon policy) | 👁️ Read (via anon policy) |
| scenario_objectives | 👁️ Read | 👁️ Read (via anon policy) | 👁️ Read (via anon policy) |
| personas | 👁️ Read | 👁️ Read (via anon policy) | 👁️ Read (via anon policy) |
| system_prompts | 👁️ Read | 👁️ Read (via anon policy) | 👁️👋✏️🗑️ Full Access |
| scenario_prompts | 👁️ Read | 👁️ Read (via anon policy) | 👁️👋✏️🗑️ Full Access |
| persona_prompts | 👁️ Read | 👁️ Read (via anon policy) | 👁️👋✏️🗑️ Full Access |
| feedback_prompts | 👁️ Read | 👁️ Read (via anon policy) | 👁️👋✏️🗑️ Full Access |
| conversations | 👁️👋✏️🗑️ Full Access* | 👁️👋✏️🗑️ (Own data only)** | 👁️👋✏️🗑️ (Own data only)** |
| messages | 👁️👋✏️🗑️ Full Access* | 👁️👋✏️🗑️ (Own data only)** | 👁️👋✏️🗑️ (Own data only)** |

**Legend:**
- 👁️ Read
- 👋 Insert
- ✏️ Update
- 🗑️ Delete

**Notes:**
* There are conflicting policies for anonymous users. While full access is currently granted, there's a commented policy that would restrict this once authentication is implemented.
* For authenticated and admin users, conversations and messages access is limited to only their own data through user-specific policies.

---

# The Future version should like this: 
TODO: create a note about anonymous users
TODO: No Access to conversations and messages for Api_User (App_Service). 
TODO: Organiser Admin User should be added in the Future version
TODO: Admin can edit all the tables except Conversations and Messages
TODO: Admin users should not be able to read messages (optional privacy feature)
TODO: Organiser Admin can only edit Scenarios 
TODO: App_Service has acccess to mannonymous user conversation

| Table | ~~Anonymous Users (Current)~~ | Authenticated Users (Future) | Admin Users | App_Service (Future) |
|-------|---------------------------|------------------------------|-------------|----------------------|
| scenarios | 👁️ (Read) | ❌ (No Access) | 👁️ (Read) | 👁️ (Read) |
| scenario_objectives | 👁️ (Read) | ❌ (No Access) | 👁️ (Read) | 👁️ (Read) |
| personas | 👁️ (Read) | ❌ (No Access) | 👁️ (Read) | 👁️ (Read) |
| system_prompts | 👁️ (Read) | ❌ (No Access) | 🔧 (Full Access) | 👁️ (Read) |
| scenario_prompts | 👁️ (Read) | ❌ (No Access) | 🔧 (Full Access) | 👁️ (Read) |
| persona_prompts | 👁️ (Read) | ❌ (No Access) | 🔧 (Full Access) | 👁️ (Read) |
| feedback_prompts | 👁️ (Read) | ❌ (No Access) | 🔧 (Full Access) | 👁️ (Read) |
| conversations | 🔓 (Read/Write/Delete) | 👤 (Own Only via RLS) | 👤 (Own Only via RLS) | 📋 (Limited by RLS) |
| messages | 🔓 (Read/Write/Delete) | 👤 (Own Only via RLS) | 👤 (Own Only via RLS) | 📋 (Limited by RLS) |

Legend:
- 👁️ = Read-only access
- 🔓 = Unrestricted access (current anonymous setup)
- 👤 = Access only to own data via RLS policies
- 🔧 = Administrative access
- 📋 = Access limited by RLS policies
- ❌ = No access