'use server'
import { getAIResponse, createBasePromptForMessage } from "@/lib/server/llm";
import { getConversationContext, saveMessages, getAllChatMessages } from "@/lib/server/db";
import OpenAI from "openai";
import { sanitiseInput, validateMessage, checkResponseSafety } from '@/lib/server/security';
import { checkRateLimit } from '@/lib/server/security';

export async function sendMessage({
  conversationId,
  content,
  userId,
}: {
  conversationId: string;
  content: string;
  userId: string;
  scenarioId?: string;
}) {
  try {
    // Check rate limit first
    if (!checkRateLimit(userId)) {
      throw new Error("Rate limit exceeded. Please wait before sending another message.");
    }

    // Sanitize and validate user input
    const sanitisedContent = sanitiseInput(content);
    const validationResult = await validateMessage(sanitisedContent);
    
    if (!validationResult.isValid) {
      throw new Error(validationResult.error || "Invalid message content detected");
    }

    const { persona, scenario, systemPrompt } = await getConversationContext(conversationId);

    const messagesData = await getAllChatMessages(conversationId);

    if (!persona || !scenario || !systemPrompt || !messagesData) {
      throw new Error("Missing persona, scenario, systemPrompt, or messagesData");
    }

    // Create a structured prompt that maintains context
    const basePrompt = await createBasePromptForMessage(persona, scenario, systemPrompt);
    const instruction = `Remember to maintain consistent personality and context throughout the conversation. Previous context: This is message ${
      messagesData.length + 1
    } in the conversation.`;

    const messages = [
      // System message with context
      {
        role: "system",
        content: `${basePrompt}\n ${instruction}`,
      },
      // append conversation history
      ...messagesData.map((msg: OpenAI.ChatCompletionMessageParam) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: sanitisedContent,
      },
    ] as OpenAI.ChatCompletionMessageParam[];

    const aiResponse = await getAIResponse(messages);
    if (!aiResponse) throw new Error("No response from AI");

    // Check if the response contains any parts of the system prompt
    const isResponseSafe = await checkResponseSafety(aiResponse, systemPrompt);
    if (!isResponseSafe) {
      throw new Error("Response contains sensitive information");
    }

    await saveMessages(conversationId, sanitisedContent, aiResponse);

    return { content: aiResponse };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
}
