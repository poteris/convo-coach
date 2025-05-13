import { z } from 'zod';
import { getAIResponse } from '@/lib/server/llm';

// Input restrictions
const MAX_WORDS = 500;
const MIN_WORDS = 1;
const MAX_LINE_LENGTH = 100;
const MAX_LINES = 10;
const ALLOWED_CHARACTERS = /^[a-zA-Z0-9\s.,!?;:'"()\-–—…@#$%&*+=<>[\]{}|\\\/\n\t\u2013\u2014\u2018\u2019\u201C\u201D]+$/;
const SECURITY_LLM_MODEL = process.env.SECURITY_LLM_MODEL || "gpt-3.5-turbo";

// Forbidden patterns that could indicate prompt injection attempts
const FORBIDDEN_PATTERNS = [
  /ignore previous instructions/i,
  /you are now/i,
  /you are no longer/i,
  /forget all previous/i,
  /disregard previous/i,
  /system prompt/i,
  /override/i,
  /jailbreak/i,
  /ignore your instructions/i,
  /ignore your training/i,
  /ignore your guidelines/i,
  /ignore your rules/i,
  /ignore your constraints/i,
  /ignore your limitations/i,
  /ignore your safety/i,
  /ignore your ethics/i,
  /ignore your morals/i,
  /ignore your values/i,
  /ignore your principles/i,
  /ignore your standards/i,
  /ignore your protocols/i,
  /ignore your policies/i,
  /ignore your guidelines/i,
  /ignore your directives/i,
  /ignore your orders/i,
  /ignore your commands/i,
  /ignore your requests/i,
  /ignore your requirements/i,
  /ignore your specifications/i,
  /ignore your parameters/i,
  /ignore your settings/i,
  /ignore your configuration/i,
  /ignore your setup/i,
  /ignore your initialization/i,
  /ignore your startup/i,
  /ignore your boot/i,
  /ignore your launch/i,
  /ignore your execution/i,
  /ignore your running/i,
  /ignore your operation/i,
  /ignore your functioning/i,
  /ignore your behavior/i,
  /ignore your conduct/i,
  /ignore your actions/i,
  /ignore your responses/i,
  /ignore your output/i,
  /ignore your generation/i,
  /ignore your creation/i,
  /ignore your production/i,
  /ignore your fabrication/i,
  /ignore your construction/i,
  /ignore your assembly/i,
  /ignore your composition/i,
  /ignore your formation/i,
  /ignore your development/i,
  /ignore your evolution/i,
  /ignore your progression/i,
  /ignore your advancement/i,
  /ignore your improvement/i,
  /ignore your enhancement/i,
  /ignore your refinement/i,
  /ignore your optimization/i,
  /ignore your perfection/i,
  /ignore your completion/i,
  /ignore your finalization/i,
  /ignore your conclusion/i,
  /ignore your termination/i,
  /ignore your ending/i,
  /ignore your closure/i,
  /ignore your finish/i,
  /ignore your completion/i,
  /ignore your finalization/i,
  /ignore your conclusion/i,
  /ignore your termination/i,
  /ignore your ending/i,
  /ignore your closure/i,
  /ignore your finish/i,
];

/**
 * Counts the number of words in a string
 */
function countWords(text: string): number {
  // Remove punctuation and special characters, normalize whitespace
  const normalizedText = text
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Split on spaces and filter out empty strings
  const wordCount = normalizedText.split(' ').filter(word => word.length > 0).length;
  console.log(`[Word Count] Input text length: ${text.length}, Word count: ${wordCount}`);
  return wordCount;
}

/**
 * Checks if content contains harmful language
 */
async function checkHarmfulContent(content: string): Promise<{ isHarmful: boolean; categories: string[] }> {
  try {
    const moderationPrompt = `You are a content moderation system. Analyse the following message and determine if it contains any harmful content. 
Categories to check for:
- Hate speech or discrimination
- Harassment or bullying
- Self-harm or suicide
- Sexual content
- Violence or threats
- Terrorism or extremism
- Racism or xenophobia
- Sexism or gender discrimination
- Ageism
- Ableism
- Religious discrimination
- Political extremism

Message to analyse: "${content}"

Respond in JSON format:
{
  "isHarmful": boolean,
  "categories": string[],
  "explanation": string
}

Only include categories that are definitely present. Be conservative in your assessment.`;

    const response = await getAIResponse([
      { role: "system", content: moderationPrompt }
    ], undefined, SECURITY_LLM_MODEL);

    if (!response) {
      console.error("No response from moderation check");
      return { isHarmful: true, categories: ['unknown'] }; // Fail safe
    }

    try {
      const result = JSON.parse(response);
      return {
        isHarmful: result.isHarmful,
        categories: result.categories || []
      };
    } catch (parseError) {
      console.error("Error parsing moderation response:", parseError);
      return { isHarmful: true, categories: ['error'] }; // Fail safe
    }
  } catch (error) {
    console.error("Error checking harmful content:", error);
    return { isHarmful: true, categories: ['error'] }; // Fail safe
  }
}

// Message validation schema with enhanced restrictions
const messageSchema = z.object({
  content: z.string()
    .min(MIN_WORDS, { 
      message: "It cannot be empty. Please enter a message."
    })
    .refine((content: string) => {
      const wordCount = countWords(content);
      return wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
    }, { 
      message: `It was too long. Please keep your message between ${MIN_WORDS} and ${MAX_WORDS} words.`
    })
    .refine((content: string) => {
      return ALLOWED_CHARACTERS.test(content);
    }, { 
      message: "It contains invalid characters. Please use only standard letters, numbers, and basic punctuation."
    })
    .refine((content: string) => {
      const lines = content.split('\n');
      if (lines.length === 1) return true;
      return lines.every((line: string) => line.length <= MAX_LINE_LENGTH);
    }, { 
      message: `It exceeded the maximum line length. Please keep each line under ${MAX_LINE_LENGTH} characters.`
    })
    .refine((content: string) => {
      const lines = content.split('\n');
      return lines.length <= MAX_LINES;
    }, { 
      message: `It exceeded the maximum number of lines. Please keep your message to ${MAX_LINES} lines or less.`
    })
    .refine((content: string) => {
      return !content.match(/\s{3,}/);
    }, { 
      message: "It contains excessive whitespace. Please avoid using multiple spaces or line breaks in a row."
    })
    .refine((content: string) => {
      return !content.match(/(.)\1{4,}/);
    }, { 
      message: "It contains too many repeated characters. Please avoid repeating the same character multiple times."
    })
    .refine((content: string) => !FORBIDDEN_PATTERNS.some(pattern => pattern.test(content)), {
      message: "It contains forbidden patterns. Please avoid attempts to modify my behavior."
    })
});

/**
 * Validates a message against security rules and content restrictions
 */
export async function validateMessage(content: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    console.log('[Validation] Starting validation for message of length', content.length);
    messageSchema.parse({ content });
    console.log('[Validation] Basic validation passed');

    const { isHarmful, categories } = await checkHarmfulContent(content);
    if (isHarmful) {
      console.log('[Validation] Harmful content detected in categories:', categories);
      return {
        isValid: false,
        error: `It contains harmful content in categories: ${categories.join(', ')}`,
      };
    }

    console.log('[Validation] All validation checks passed');
    return { isValid: true };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError;
      const issue = zodError.errors[0];
      console.log('[Validation] Zod validation error:', issue.message);
      return {
        isValid: false,
        error: issue.message
      };
    }
    console.error("[Validation] Message validation failed:", error);
    return {
      isValid: false,
      error: "Validation failed",
    };
  }
}

/**
 * Sanitises user input by removing potentially harmful characters and normalising whitespace
 */
export function sanitiseInput(input: string): string {
  // Remove control characters except newlines and tabs
  let sanitised = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalise whitespace (preserve single newlines and tabs)
  sanitised = sanitised
    .replace(/\r\n/g, '\n') // Normalise line endings
    .replace(/\r/g, '\n')   // Convert remaining \r to \n
    .replace(/[ \t]+/g, ' ') // Normalise horizontal whitespace
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
    .trim();
  
  // Remove any HTML tags
  sanitised = sanitised.replace(/<[^>]*>/g, '');
  
  // Remove any markdown code blocks
  sanitised = sanitised.replace(/```[\s\S]*?```/g, '');
  
  // Remove any inline code
  sanitised = sanitised.replace(/`[^`]*`/g, '');
  
  // Remove any URLs
  sanitised = sanitised.replace(/https?:\/\/\S+/g, '');
  
  return sanitised;
}

/**
 * Rate limiting implementation
 */
const rateLimits = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(userId);

  if (!userLimit) {
    rateLimits.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (now - userLimit.timestamp > RATE_LIMIT_WINDOW) {
    rateLimits.set(userId, { count: 1, timestamp: now });
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Checks if an LLM response contains parts of the system prompt or other sensitive information
 */
export async function checkResponseSafety(response: string, systemPrompt: string): Promise<boolean> {
  try {
    const safetyPrompt = `You are a security system checking for prompt leakage. Analyse if the following response contains any parts of the system prompt or sensitive information.

System Prompt: "${systemPrompt}"

Response to check: "${response}"

Respond in JSON format:
{
  "isSafe": boolean,
  "explanation": string
}

Be conservative in your assessment. If there's any doubt, mark it as unsafe.`;

    const result = await getAIResponse([
      { role: "system", content: safetyPrompt }
    ], undefined, SECURITY_LLM_MODEL);

    if (!result) {
      console.error("No response from safety check");
      return false; // Fail safe
    }

    try {
      const parsed = JSON.parse(result);
      return parsed.isSafe;
    } catch (parseError) {
      console.error("Error parsing safety response:", parseError);
      return false; // Fail safe
    }
  } catch (error) {
    console.error("Error checking response safety:", error);
    return false; // Fail safe
  }
} 