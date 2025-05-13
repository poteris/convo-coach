import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import {  getAIResponse, createBasePromptForMessage } from "@/lib/server/llm";
import { getConversationContext, saveMessages } from "@/lib/server/db";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, validateMessage, sanitiseInput } from "@/lib/server/security";

const userMessageResponseSchema = z.object({
  id: z.string(),
  text: z.string(),
  sender: z.string(),
});

const sendUserMessageRequestSchema = z.object({
  conversationId: z.string(),
  content: z.string(),
  scenario_id: z.string(),
});

async function sendMessage(headers: Headers, { conversationId, content }: { conversationId: string; content: string; scenarioId?: string }) {
  try {
    console.log('[API] Starting message processing');
    // Sanitize and validate user input
    const sanitisedContent = sanitiseInput(content);
    console.log('[API] Content sanitized, length:', sanitisedContent.length);
    
    const validationResult = await validateMessage(sanitisedContent);
    console.log('[API] Validation result:', validationResult);
    
    if (!validationResult.isValid) {
      console.log('[API] Validation failed, returning friendly message');
      const errorMessage = `I'm sorry, but I can't process your message. ${validationResult.error}`;
      // Save both the user message and the validation error to the database, but exclude from LLM context
      await saveMessages(conversationId, sanitisedContent, errorMessage, false);
      return { content: errorMessage, isValidationError: true };
    }

    console.log('[API] Validation passed, proceeding with message processing');
    const supabase = await createClient();
    // Get conversation context
    const { persona, scenario, systemPrompt } = await getConversationContext(conversationId);

    // Get message history, only including messages marked for LLM context
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .eq('llm_context', true)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;
    
    // Create a structured prompt that maintains context
    const completePrompt = await createBasePromptForMessage(persona, scenario, systemPrompt);
    
    // Organise messages with clear context preservation
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      // System message with complete context
      { 
        role: "system", 
        content: `${completePrompt}\n\nRemember to maintain consistent personality and context throughout the conversation. Previous context: This is message ${messagesData.length + 1} in the conversation.`
      },
      // Previous conversation history (only messages marked for LLM context)
      ...messagesData.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "system" | "assistant",
        content: msg.content,
      } as OpenAI.ChatCompletionMessageParam)),
      // New user message
      { 
        role: "user", 
        content: sanitisedContent 
      }
    ];

    const aiResponse: string | null = await getAIResponse(messages, { headers });
    if (aiResponse) {
      await saveMessages(conversationId, sanitisedContent, aiResponse, true);
    }

    return { content: aiResponse, isValidationError: false };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsedBody = sendUserMessageRequestSchema.parse(body);

    // Check rate limit using conversationId
    if (!checkRateLimit(parsedBody.conversationId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    const response = await sendMessage(req.headers as Headers, parsedBody);

    if (!response.content) {
      console.error("Error invoking assistant function:");
      return NextResponse.json({ error: "Failed to get a message from LLM" }, { status: 500 });
    }

    const message = { id: uuid(), text: response.content, sender: "bot" };
    const parsedResponse = userMessageResponseSchema.parse(message);

    return NextResponse.json(parsedResponse, { status: 200 });
  } catch (error) {
    console.error("Error creating new chat:", error);
    return NextResponse.json({ error: "Failed to create new chat" }, { status: 500 });
  }
}
