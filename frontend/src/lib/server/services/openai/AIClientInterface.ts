import { ChatCompletionRequest, ChatCompletionResponse } from './ChatCompletionTypes';

export interface AIClientInterface {
  createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
} 