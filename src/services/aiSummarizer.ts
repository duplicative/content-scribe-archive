
interface SummarizeRequest {
  content: string;
  apiKey: string;
  model: string;
  prompt?: string;
}

interface CustomPrompt {
  id: string;
  name: string;
  content: string;
}

interface SummarizeResponse {
  summary: string;
}

export class AISummarizer {
  private static readonly DEFAULT_PROMPT = `Please provide a comprehensive summary of the following article. Focus on the main points, key insights, and important details. Make the summary clear and well-structured:

`;

  static async summarizeText({ content, apiKey, model, prompt }: SummarizeRequest): Promise<string> {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    const promptToUse = prompt || this.DEFAULT_PROMPT;

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
            content: promptToUse + content
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

  static getDefaultPrompts(): CustomPrompt[] {
    return [
      {
        id: 'default',
        name: 'Default Summary',
        content: 'Please provide a comprehensive summary of the following article. Focus on the main points, key insights, and important details. Make the summary clear and well-structured:\n\n'
      },
      {
        id: 'brief',
        name: 'Brief Summary',
        content: 'Provide a brief, concise summary of the following article in 2-3 sentences:\n\n'
      },
      {
        id: 'bullet-points',
        name: 'Bullet Points',
        content: 'Summarize the following article using bullet points to highlight the key information:\n\n'
      },
      {
        id: 'academic',
        name: 'Academic Analysis',
        content: 'Provide an academic-style analysis and summary of the following article, including methodology, findings, and implications:\n\n'
      }
    ];
  }

  static saveCustomPrompts(prompts: CustomPrompt[]) {
    localStorage.setItem('custom_prompts', JSON.stringify(prompts));
  }

  static getCustomPrompts(): CustomPrompt[] {
    const saved = localStorage.getItem('custom_prompts');
    return saved ? JSON.parse(saved) : [];
  }

  static getAllPrompts(): CustomPrompt[] {
    return [...this.getDefaultPrompts(), ...this.getCustomPrompts()];
  }

  static saveSelectedPrompt(promptId: string) {
    localStorage.setItem('selected_prompt', promptId);
  }

  static getSelectedPrompt(): string {
    return localStorage.getItem('selected_prompt') || 'default';
  }
}
