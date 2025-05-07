import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface ChatCompletionRequest {
  messages: ChatCompletionMessageParam[];
  model: string;
  temperature?: number;
  max_tokens?: number;

  tool_choice?: {
    type: string;
    function: {
      name: string;
    };
  };
  tools?: Array<{
    type: string;
    function: {
      name: string;
    };
  }>;
  store?: boolean;
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      tool_calls?: Array<{
        function: {
          name: string;
          arguments: string;
        };
      }>;
      content?: string;
    };
  }>;
} 