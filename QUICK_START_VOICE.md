# 🎤 Quick Start - LiveKit Voice System

## First-Time Setup (One-Time Only)

### 1. Install Dependencies
```bash
# Install Node.js packages
pnpm install

# Setup Python agent
cd backend/livekit-agent
./setup.sh
cd ../..

# Copy environment to Python agent
cp .env backend/livekit-agent/.env
```

### 2. Run Database Migration
```bash
cd backend
npx supabase db push
```

---

## Daily Development

### Start Everything (One Command - macOS)
```bash
./start-voice-dev.sh
```

### Or Start Manually (3 Terminals)

**Terminal 1 - Frontend:**
```bash
cd frontend
pnpm dev
```

**Terminal 2 - Python Voice Agent:**
```bash
cd backend/livekit-agent
source venv/bin/activate
python agent.py dev
```

**Terminal 3 - Database (if local):**
```bash
cd backend
npx supabase start
```

---

## Test Voice Feature

1. Open http://localhost:3000
2. Navigate to a scenario
3. Click "Start Voice Chat"
4. Allow microphone
5. Talk to the AI
6. Verify fast response times!

---

## Troubleshooting

**Problem:** Python agent crashes on startup  
**Solution:**
```bash
cd backend/livekit-agent
source venv/bin/activate
pip install --upgrade livekit livekit-agents livekit-plugins-groq livekit-plugins-elevenlabs
```

**Problem:** "LiveKit credentials not configured"  
**Solution:** Check your `.env` file has all these:
```
GROQ_API_KEY=...
LIVEKIT_URL=wss://...
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
ELEVEN_LABS_API_KEY=...
```

**Problem:** No audio from AI  
**Solution:** Check Terminal 2 (Python agent) for errors

---

## Performance Check

Expected latency: **400-700ms** (vs old 1200-1700ms)

If you're seeing delays:
1. Check Groq API status
2. Check ElevenLabs API status
3. Check Python agent logs for slow responses

---

## 📚 More Info

- **Full Guide:** `LIVEKIT_MIGRATION_GUIDE.md`
- **Implementation Details:** `LIVEKIT_IMPLEMENTATION_SUMMARY.md`
- **Python Agent Docs:** `backend/livekit-agent/README.md`

---

**Happy Coding! 🚀**

