
interface SummarizeRequest {
  content: string;
  apiKey: string;
  model: string;
}

interface SummarizeResponse {
  summary: string;
}

export class AISummarizer {
  private static readonly DEFAULT_PROMPT = `Please provide a comprehensive summary of the following article. Focus on the main points, key insights, and important details. Make the summary clear and well-structured:

`;

  static async summarizeText({ content, apiKey, model }: SummarizeRequest): Promise<string> {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'ReadLater App'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: this.DEFAULT_PROMPT + content
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No summary generated';
  }

  static getAvailableModels() {
    return [
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
      { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'openai/gpt-4', name: 'GPT-4' },
      { id: 'meta-llama/llama-2-70b-chat', name: 'Llama 2 70B' }
    ];
  }

  static saveApiKey(apiKey: string) {
    localStorage.setItem('openrouter_api_key', apiKey);
  }

  static getApiKey(): string {
    return localStorage.getItem('openrouter_api_key') || '';
  }

  static savePreferredModel(model: string) {
    localStorage.setItem('preferred_ai_model', model);
  }

  static getPreferredModel(): string {
    return localStorage.getItem('preferred_ai_model') || 'anthropic/claude-3-haiku';
  }
}
