"""
LiveKit Voice Agent for Convo Coach
Uses Groq for STT/LLM and ElevenLabs for TTS
"""

import asyncio
import json
import os
from typing import Annotated

from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.plugins import groq, elevenlabs

# Load environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ELEVEN_LABS_API_KEY = os.getenv("ELEVEN_LABS_API_KEY")


class VoiceAssistant:
    """Voice assistant that uses Groq for STT/LLM and ElevenLabs for TTS"""

    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.chat_ctx = None
        self.assistant = None

    async def entrypoint(self, room: rtc.Room):
        """Main entry point when participant joins room"""

        # Get metadata from participant
        metadata = self.get_room_metadata(room)
        system_prompt = metadata.get("systemPrompt", "You are a helpful assistant.")
        voice_id = metadata.get("voiceId", "21m00Tcm4TlvDq8ikWAM")  # Default Rachel voice
        persona_name = metadata.get("personaName", "Assistant")
        scenario_title = metadata.get("scenarioTitle", "Training")

        print(f"🎙️ Voice assistant started")
        print(f"👤 Persona: {persona_name}")
        print(f"📋 Scenario: {scenario_title}")
        print(f"🎤 Voice ID: {voice_id}")
        print(f"📝 System prompt length: {len(system_prompt)}")

        # Initialize chat context with system prompt
        initial_ctx = agents.llm.ChatContext()
        initial_ctx.append(
            role="system",
            text=system_prompt
        )

        # Create assistant with Groq + ElevenLabs
        self.assistant = agents.VoicePipelineAgent(
            # Speech-to-Text: Groq Whisper (ultra-fast)
            stt=groq.STT(
                model="whisper-large-v3-turbo",
                language="en",
            ),
            # Large Language Model: Groq LLaMA
            llm=groq.LLM(
                model="llama-3.3-70b-versatile",  # Fast and capable
                temperature=0.7,
            ),
            # Text-to-Speech: ElevenLabs
            tts=elevenlabs.TTS(
                voice_id=voice_id,
                model_id="eleven_flash_v2_5",  # Fastest model
                optimize_streaming_latency=4,
            ),
            chat_ctx=initial_ctx,
        )

        # Start the assistant
        self.assistant.start(room)

        # Send initial greeting
        await self.assistant.say(
            f"Hello, I'm {persona_name}. How may I assist you today?",
            allow_interruptions=True
        )

        print(f"✅ Assistant ready and listening...")

    def get_room_metadata(self, room: rtc.Room) -> dict:
        """Extract metadata from room participants"""
        for participant in room.remote_participants.values():
            if participant.metadata:
                try:
                    return json.loads(participant.metadata)
                except json.JSONDecodeError:
                    print(f"⚠️ Failed to parse metadata from participant {participant.identity}")
                    pass
        
        # Also check local participant
        if room.local_participant and room.local_participant.metadata:
            try:
                return json.loads(room.local_participant.metadata)
            except json.JSONDecodeError:
                pass
        
        return {}


async def entrypoint(ctx: JobContext):
    """Entry point for LiveKit agent"""
    await ctx.connect()
    
    print(f"🔗 Connected to room: {ctx.room.name}")
    print(f"👥 Participants: {len(ctx.room.remote_participants)}")
    
    assistant = VoiceAssistant(ctx)
    await assistant.entrypoint(ctx.room)


if __name__ == "__main__":
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )

