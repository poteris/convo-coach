# Voice Chat Setup Instructions

## 🚨 IMPORTANT: API Key Configuration Required

The voice chat feature requires an ElevenLabs API key to function. Follow these steps to set it up:

### Step 1: Get Your ElevenLabs API Key

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/settings/api-keys)
2. Sign in to your account (or create one if needed)
3. Navigate to **Settings** → **API Keys**
4. Copy your API key

### Step 2: Configure Environment Variable

Create a `.env.local` file in the **frontend** directory:

```bash
# Navigate to the frontend directory
cd frontend

# Create the environment file
touch .env.local
```

Add your API key to the `.env.local` file:

```env
# ElevenLabs API Configuration
ELEVEN_LABS_API_KEY=your_actual_api_key_here
```

**Replace `your_actual_api_key_here` with your real ElevenLabs API key!**

### Step 3: Verify Your ElevenLabs Account

Make sure your ElevenLabs account has:

1. **✅ Conversational AI Access**: Check your subscription plan
2. **✅ Available Credits**: Ensure you have sufficient minutes/credits
3. **✅ API Permissions**: Verify your API key has the correct permissions

### Step 4: Restart Your Development Server

After adding the API key:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## 🔧 Troubleshooting

### Problem: Still getting 405 errors

**Possible causes:**
1. **API Key not set**: Double-check your `.env.local` file
2. **Wrong API key**: Verify you copied the correct key from ElevenLabs
3. **Account limitations**: Your ElevenLabs plan might not include Conversational AI
4. **API endpoint changes**: ElevenLabs may have updated their API

**Solutions:**
1. Check the browser console and server logs for detailed error messages
2. Verify your ElevenLabs account status and subscription
3. Try creating a simple test API call to ElevenLabs to verify your key works

### Problem: "ELEVEN_LABS_API_KEY not configured" error

This means the environment variable isn't being loaded:

1. Make sure `.env.local` is in the `frontend/` directory (not the root)
2. Restart your development server completely
3. Check that there are no typos in the variable name

### Problem: Voice chat button doesn't appear

1. Go to `/organiser-admin` → **Branding** tab
2. Toggle "Enable Voice Chat" to **ON**
3. Assign voices to your personas in the "Configure Persona Voices" section

## 📊 Debug Information

The updated code now includes comprehensive logging. Check your server console for:

- 🎙️ Voice session start requests
- 👤 Persona fetching
- 🏢 Organization settings
- 🤖 ElevenLabs agent creation attempts
- 🔗 WebSocket URL generation

## 🎯 Testing Steps

1. **Set up API key** (steps above)
2. **Enable voice in admin**: Go to `/organiser-admin` → Branding → Enable Voice Chat
3. **Assign voice to persona**: Select a British voice for your persona
4. **Start a scenario**: Go to home → select scenario → continue
5. **Try voice chat**: Click "Start Voice Chat" button
6. **Check logs**: Look at browser console and server logs for detailed information

## 💡 API Key Security

- ✅ **DO**: Store API key in `.env.local` (server-side only)
- ❌ **DON'T**: Commit API keys to version control
- ❌ **DON'T**: Expose API keys in client-side code

The `.env.local` file is automatically ignored by git and only accessible server-side.

## 🔄 Next Steps After Setup

Once your API key is configured and working:

1. Test voice chat functionality
2. Verify transcript saving
3. Check feedback generation with voice conversations
4. Monitor ElevenLabs usage in their dashboard

## 📞 Support

If you continue having issues after following these steps:

1. Check the detailed logs in browser console and server terminal
2. Verify your ElevenLabs account status and API key permissions
3. Test with a simple ElevenLabs API call outside of the application

---

**Updated:** October 16, 2025  
**Status:** Ready for testing with proper API key configuration




