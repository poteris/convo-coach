export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;

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
  temperature?: number;
  max_tokens?: number;
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