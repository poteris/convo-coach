// Server-only module. Deliberately not marked 'use server': that directive would
// expose every export below as a callable server action, letting any client create
// ElevenLabs agents with an arbitrary prompt on our API key.

import { Persona } from "@/types/persona";
import { TrainingScenario } from "@/types/scenarios";
import { BritishVoice, getVoiceOrDefault } from "@/const/voices";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

// LLM that ElevenLabs runs the agent on. Must be one of the models ElevenLabs
// Conversational AI supports. Override with ELEVEN_LABS_LLM.
const VOICE_LLM = process.env.ELEVEN_LABS_LLM || "gpt-4o-mini";
const TTS_MODEL = process.env.ELEVEN_LABS_TTS_MODEL || "eleven_flash_v2";

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
}

export interface ElevenLabsTranscript {
  conversation_id: string;
  agent_id: string;
  transcript: { role: "agent" | "user"; message: string; time_in_call_secs: number }[];
  call_duration_secs?: number;
  metadata?: { call_duration_secs?: number };
}

function apiKey(): string {
  const key = process.env.ELEVEN_LABS_API_KEY;
  if (!key) {
    throw new Error("ELEVEN_LABS_API_KEY not configured");
  }
  return key;
}

async function elevenLabsFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${ELEVENLABS_API}${path}`, {
    ...init,
    headers: {
      "xi-api-key": apiKey(),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`ElevenLabs ${init.method || "GET"} ${path} failed: ${response.status} ${detail}`);
  }
  return response;
}

/**
 * Pick the persona's voice, falling back to the first voice in the account if the
 * curated voice has not been added to this ElevenLabs account.
 */
async function resolveVoice(persona: Persona): Promise<BritishVoice> {
  const voice = getVoiceOrDefault(persona.voice_id ?? undefined, persona.gender);

  const response = await elevenLabsFetch("/voices");
  const { voices = [] } = (await response.json()) as { voices?: ElevenLabsVoice[] };

  if (voices.length === 0 || voices.some((v) => v.voice_id === voice.id)) {
    return voice;
  }

  const fallback = voices[0];
  console.warn(`Voice ${voice.name} (${voice.id}) is not in the ElevenLabs account; using ${fallback.name}`);
  return {
    id: fallback.voice_id,
    name: fallback.name,
    accent: "Account default",
    description: fallback.name,
    gender: voice.gender,
  };
}

/**
 * Create an ElevenLabs Conversational AI agent that plays the persona.
 * One agent is created per conversation and deleted when the session ends.
 */
export async function createElevenLabsAgent(
  persona: Persona,
  scenario: TrainingScenario,
  systemPrompt: string
): Promise<string> {
  if (!systemPrompt?.trim()) {
    throw new Error("System prompt is required but was empty");
  }

  const voice = await resolveVoice(persona);

  const prompt =
    `${systemPrompt}\n\n` +
    `This is a spoken phone or face-to-face conversation. Keep replies short and natural, ` +
    `as ${persona.name} would actually speak. Do not prefix replies with your name or any label.`;

  const response = await elevenLabsFetch("/convai/agents/create", {
    method: "POST",
    body: JSON.stringify({
      name: `${persona.name} - ${scenario.title}`.slice(0, 100),
      conversation_config: {
        agent: {
          prompt: {
            prompt,
            llm: VOICE_LLM,
            temperature: 0.7,
          },
          // Empty first message: the rep speaks first, as in text mode.
          first_message: "",
          language: "en",
        },
        tts: {
          voice_id: voice.id,
          model_id: TTS_MODEL,
          optimize_streaming_latency: 3,
          stability: 0.5,
          similarity_boost: 0.75,
        },
        asr: {
          quality: "high",
        },
      },
    }),
  });

  const { agent_id } = (await response.json()) as { agent_id: string };
  return agent_id;
}

/**
 * Get a short-lived signed WebSocket URL so the browser can talk to the agent
 * without seeing our API key.
 */
export async function getSignedWebSocketUrl(agentId: string): Promise<string> {
  const response = await elevenLabsFetch(
    `/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`
  );
  const { signed_url } = (await response.json()) as { signed_url: string };
  return signed_url;
}

/**
 * Get conversation transcript from ElevenLabs
 */
export async function getConversationTranscript(elevenLabsConversationId: string): Promise<ElevenLabsTranscript> {
  const response = await elevenLabsFetch(`/convai/conversations/${encodeURIComponent(elevenLabsConversationId)}`);
  return (await response.json()) as ElevenLabsTranscript;
}

/**
 * Delete a per-conversation agent so they do not pile up in the ElevenLabs account.
 */
export async function deleteElevenLabsAgent(agentId: string): Promise<void> {
  await elevenLabsFetch(`/convai/agents/${encodeURIComponent(agentId)}`, { method: "DELETE" });
}
