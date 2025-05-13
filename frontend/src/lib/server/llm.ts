'use server'
import { Persona } from "@/types/persona";
import { TrainingScenario } from "@/types/scenarios";
import Handlebars from "handlebars";
import { getOpenAIClient } from './services/openai/OpenAIClientFactory';
import { ChatCompletionRequest } from './services/openai/ChatCompletionTypes';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const llmModel = process.env.LLM_MODEL || "gpt-4o";

export type Message = ChatCompletionMessageParam;

interface AIResponseOptions {
  headers?: Headers;
  model?: string;
}

export async function getAIResponse(
  messages: Message[],
  options?: AIResponseOptions
): Promise<string | null> {
  const model = options?.model || llmModel;
  const headers = options?.headers || new Headers();

  try {
    const params: ChatCompletionRequest = {
      messages,
      model: model || llmModel,
      temperature: 0.7,
      max_tokens: 1000,
    };

    const completion = await getOpenAIClient(headers).createChatCompletion(params);
    return completion.choices[0]?.message?.content ?? null;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return null;
  }
}

export async function createBasePromptForMessage(
  persona: Persona,
  scenario: TrainingScenario,
  systemPrompt: string,
): Promise<string> {
  try {
    // Process the template with all context
    const template = Handlebars.compile(systemPrompt);
    const finalPrompt = template({
      title: scenario.title.toLowerCase(),
      description: scenario.description.toLowerCase(),
      name: persona.name,
      age: persona.age,
      gender: persona.gender.toLowerCase(),
      job: persona.job,
      family_status: persona.family_status.toLowerCase(),
      segment: persona.segment,
      major_issues: persona.major_issues,
      uk_party_affiliation: persona.uk_party_affiliation,
      personality_traits: persona.personality_traits,
      emotional_conditions: persona.emotional_conditions,
      busyness_level: persona.busyness_level,
      location: persona.location,
    });
    return finalPrompt;
  } catch (error) {
    console.error("Error in createBasePromptForMessage:", error);
    return systemPrompt;
  }
}

