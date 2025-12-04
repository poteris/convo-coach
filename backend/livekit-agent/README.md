# LiveKit Voice Agent

This is the Python-based voice agent that handles real-time voice conversations using:
- **Groq Whisper** for Speech-to-Text (STT)
- **Groq LLaMA** for Language Model (LLM)
- **ElevenLabs** for Text-to-Speech (TTS)

## Setup

1. **Install dependencies:**
   ```bash
   cd backend/livekit-agent
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the agent:**
   ```bash
   source venv/bin/activate
   python agent.py dev
   ```

## Architecture

The agent listens to LiveKit rooms and:
1. Receives user audio via WebRTC
2. Transcribes with Groq Whisper (~50-100ms)
3. Generates response with Groq LLaMA (~200-300ms)
4. Synthesizes speech with ElevenLabs TTS (~300-400ms)
5. Streams audio back to user

Total latency: **~400-700ms** (vs 1.2-1.7s with ElevenLabs full stack)

## Development

The agent runs as a separate service alongside your Next.js app. In development:
- Terminal 1: `npm run dev` (Next.js)
- Terminal 2: `python agent.py dev` (LiveKit agent)

## Production

Deploy the agent separately:
- Option 1: Run on same server with PM2/systemd
- Option 2: Deploy to Fly.io/Railway (recommended)
- Option 3: Use LiveKit Cloud Agents (when available)

