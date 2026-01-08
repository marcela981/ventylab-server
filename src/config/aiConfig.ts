// Configuración de proveedores de IA

export interface AIProviderConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  maxRetries?: number;
}

export const aiProviderConfigs: Record<string, AIProviderConfig> = {
  gemini: {
    name: 'gemini',
    enabled: true,
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 2048,
    timeout: 30000,
    maxRetries: 3
  },
  openai: {
    name: 'openai',
    enabled: false,
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    timeout: 30000,
    maxRetries: 3
  },
  claude: {
    name: 'claude',
    enabled: false,
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-3-opus',
    temperature: 0.7,
    maxTokens: 2048,
    timeout: 30000,
    maxRetries: 3
  },
  ollama: {
    name: 'ollama',
    enabled: false,
    model: 'llama2',
    temperature: 0.7,
    maxTokens: 2048,
    timeout: 30000,
    maxRetries: 3
  }
};

export default aiProviderConfigs;

