// TODO: Implementar Ollama Provider
// Este archivo está pendiente de implementación

export class OllamaProvider {
  private name: string;
  private model: any;
  private stats: any;

  constructor() {
    this.name = 'ollama';
    this.model = null;
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      averageConfidence: 0,
      lastRequestTime: null,
      errors: []
    };
  }

  async initialize(): Promise<boolean> {
    // TODO: Implementar inicialización de Ollama
    console.warn('Ollama Provider no implementado aún');
    return false;
  }

  isAvailable(): boolean {
    return false;
  }

  async generateResponse(prompt: string, options: any = {}) {
    throw new Error('Ollama Provider no implementado aún');
  }

  getStats() {
    return this.stats;
  }
}

export default OllamaProvider;

