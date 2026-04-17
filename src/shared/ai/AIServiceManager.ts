import { GeminiProvider } from './providers/GeminiProvider';
// Importar otros providers cuando estén disponibles
// import { OpenAIProvider } from './providers/OpenAIProvider';
// import { ClaudeProvider } from './providers/ClaudeProvider';

export class AIServiceManager {
  private preferredProvider: string;
  private providers: Map<string, any>;
  private currentProvider: any;
  private fallbackChain: string[];
  private rateLimits: Map<string, any>;
  private requestHistory: any[];
  private maxHistorySize: number;
  private rateLimitConfig: Record<string, { requests: number; window: number }>;

  constructor(preferredProvider: string = 'gemini') {
    this.preferredProvider = preferredProvider;
    this.providers = new Map();
    this.currentProvider = null;
    this.fallbackChain = ['gemini', 'openai', 'claude']; // Orden de fallback
    this.rateLimits = new Map();
    this.requestHistory = [];
    this.maxHistorySize = 1000;
    
    // Configuración de rate limiting por proveedor
    this.rateLimitConfig = {
      gemini: { requests: 60, window: 60000 }, // 60 requests per minute
      openai: { requests: 50, window: 60000 }, // 50 requests per minute
      claude: { requests: 40, window: 60000 }  // 40 requests per minute
    };
    
    this.initializeProviders();
  }

  /**
   * Inicializar todos los proveedores disponibles
   */
  async initializeProviders() {
    console.log('🚀 Inicializando AI Service Manager...');
    
    // Inicializar Gemini Provider
    try {
      const geminiProvider = new GeminiProvider();
      const geminiInitialized = await geminiProvider.initialize();
      
      if (geminiInitialized) {
        this.providers.set('gemini', geminiProvider);
      } else {
        console.warn('⚠️ Gemini Provider no pudo inicializarse');
      }
    } catch (error: any) {
      console.error('❌ Error inicializando Gemini Provider:', error);
    }

    // TODO: Inicializar otros providers cuando estén disponibles
    // await this.initializeOpenAI();
    // await this.initializeClaude();

    // Establecer provider actual
    this.setCurrentProvider(this.preferredProvider);
    
  }

  /**
   * Establecer el proveedor actual
   */
  setCurrentProvider(providerName: string): boolean {
    if (this.providers.has(providerName)) {
      this.currentProvider = this.providers.get(providerName);
      return true;
    }
    
    console.warn(`⚠️ Provider ${providerName} no disponible`);
    return false;
  }

  /**
   * Cambiar a un nuevo proveedor
   */
  switchModel(newProvider: string) {
    const success = this.setCurrentProvider(newProvider);
    
    if (success) {
      return {
        success: true,
        provider: newProvider,
        message: `Cambiado a ${newProvider}`
      };
    } else {
      const availableProviders = Array.from(this.providers.keys());
      return {
        success: false,
        error: `Provider ${newProvider} no disponible`,
        availableProviders,
        message: `Providers disponibles: ${availableProviders.join(', ')}`
      };
    }
  }

  /**
   * Generar respuesta con sistema de fallbacks
   */
  async generateResponse(prompt: string, options: any = {}) {
    const startTime = Date.now();
    
    // Validar prompt
    if (!prompt || typeof prompt !== 'string') {
      return {
        success: false,
        error: 'Prompt no válido',
        response: 'El prompt debe ser una cadena de texto válida.'
      };
    }

    // Verificar rate limiting
    const rateLimitCheck = this.checkRateLimit(this.currentProvider?.name);
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: 'Rate limit excedido',
        response: `Demasiadas solicitudes. Intenta en ${rateLimitCheck.retryAfter}ms`,
        retryAfter: rateLimitCheck.retryAfter
      };
    }

    // Intentar con el provider actual
    if (this.currentProvider) {
      try {
        const result = await this.currentProvider.generateResponse(prompt, options);
        
        // Registrar solicitud exitosa
        this.recordRequest(this.currentProvider.name, true, Date.now() - startTime);
        
        return {
          ...result,
          provider: this.currentProvider.name,
          fallbackUsed: false
        };
      } catch (error: any) {
        console.warn(`⚠️ Error con provider ${this.currentProvider.name}:`, error.message);
        this.recordRequest(this.currentProvider.name, false, Date.now() - startTime, error);
      }
    }

    // Intentar con providers de fallback
    return await this.tryFallbackProviders(prompt, options, startTime);
  }

  /**
   * Intentar con providers de fallback
   */
  private async tryFallbackProviders(prompt: string, options: any, startTime: number) {
    const currentProviderName = this.currentProvider?.name;
    const fallbackProviders = this.fallbackChain.filter(name => 
      name !== currentProviderName && this.providers.has(name)
    );

    for (const providerName of fallbackProviders) {
      const provider = this.providers.get(providerName);
      
      // Verificar rate limiting para el provider de fallback
      const rateLimitCheck = this.checkRateLimit(providerName);
      if (!rateLimitCheck.allowed) {
        console.warn(`⚠️ Rate limit excedido para ${providerName}, probando siguiente...`);
        continue;
      }

      try {
        const result = await provider.generateResponse(prompt, options);
        
        // Registrar solicitud exitosa
        this.recordRequest(providerName, true, Date.now() - startTime);
        
        return {
          ...result,
          provider: providerName,
          fallbackUsed: true,
          originalProvider: currentProviderName
        };
      } catch (error: any) {
        console.warn(`⚠️ Error con fallback ${providerName}:`, error.message);
        this.recordRequest(providerName, false, Date.now() - startTime, error);
      }
    }

    // Si todos los providers fallan
    return {
      success: false,
      error: 'Todos los providers de IA no están disponibles',
      response: 'El servicio de IA no está disponible en este momento. Por favor, intenta más tarde.',
      providers: Array.from(this.providers.keys()),
      fallbackUsed: true
    };
  }

  /**
   * Analizar configuración de ventilador (mantener interfaz actual)
   */
  async analyzeVentilatorConfiguration(
    userConfig: any,
    optimalConfig: any,
    ventilationMode: string,
    patientData: any = null
  ) {
    // Validar parámetros de entrada
    if (!userConfig || typeof userConfig !== 'object') {
      return {
        success: false,
        error: 'Configuración del usuario no válida',
        analysis: 'Por favor, asegúrate de que todos los parámetros del ventilador estén configurados correctamente.'
      };
    }

    if (!ventilationMode || !['volume', 'pressure'].includes(ventilationMode)) {
      return {
        success: false,
        error: 'Modo de ventilación no válido',
        analysis: 'El modo de ventilación debe ser "volume" o "pressure".'
      };
    }

    // Usar el método de análisis del provider actual
    if (this.currentProvider && typeof this.currentProvider.analyzeVentilatorConfiguration === 'function') {
      return await this.currentProvider.analyzeVentilatorConfiguration(
        userConfig, optimalConfig, ventilationMode, patientData
      );
    }

    // Fallback: construir prompt manualmente y usar generateResponse
    const prompt = this.buildVentilatorAnalysisPrompt(userConfig, optimalConfig, ventilationMode, patientData);
    return await this.generateResponse(prompt);
  }

  /**
   * Construir prompt para análisis de ventilador
   */
  private buildVentilatorAnalysisPrompt(
    userConfig: any,
    optimalConfig: any,
    ventilationMode: string,
    patientData: any
  ): string {
    const modeText = ventilationMode === 'volume' ? 'Volumen Control' : 'Presión Control';
    
    if (!userConfig) {
      return 'No hay configuración disponible para analizar. Por favor, configura los parámetros del ventilador primero.';
    }
    
    let prompt = `Eres un experto en ventilación mecánica. Analiza la siguiente configuración del ventilador y proporciona feedback detallado.

MODO: ${modeText}

CONFIGURACIÓN ACTUAL DEL USUARIO:
${this.formatConfig(userConfig)}

CONFIGURACIÓN ÓPTIMA RECOMENDADA:
${optimalConfig ? this.formatConfig(optimalConfig) : 'No disponible (sin datos del paciente)'}

${patientData && patientData.patientBasicData ? `DATOS DEL PACIENTE:
- Edad: ${patientData.patientBasicData.edad || 'No especificada'} años
- Peso: ${patientData.patientBasicData.peso || 'No especificado'} kg
- Altura: ${patientData.patientBasicData.altura || 'No especificada'} cm
- Diagnóstico: ${patientData.patientBasicData.diagnostico || 'No especificado'}
- Condición: ${patientData.patientBasicData.condicion || 'No especificada'}` : ''}

INSTRUCCIONES:
1. Identifica TODOS los errores en la configuración actual
2. Explica cada error en lenguaje simple y comprensible
3. Proporciona recomendaciones específicas para corregir cada error
4. Prioriza los errores por severidad (crítico, moderado, leve)
5. Considera la seguridad del paciente en primer lugar
6. Usa un tono profesional pero accesible

FORMATO DE RESPUESTA:
- Resumen ejecutivo (2-3 líneas)
- Errores críticos (si los hay)
- Errores moderados
- Errores leves
- Recomendaciones de corrección
- Consideraciones de seguridad

Responde en español.`;

    return prompt;
  }

  /**
   * Formatear configuración
   */
  private formatConfig(config: any): string {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return 'Configuración no disponible';
    }
    
    try {
      return Object.entries(config)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `- ${this.formatParameterName(key)}: ${value} ${this.getUnit(key)}`)
        .join('\n');
    } catch (error) {
      console.error('Error al formatear configuración:', error);
      return 'Error al formatear configuración';
    }
  }

  /**
   * Formatear nombre de parámetro
   */
  private formatParameterName(key: string): string {
    const names: Record<string, string> = {
      fio2: 'FiO2',
      volumen: 'Volumen Tidal',
      presionMax: 'Presión Máxima',
      peep: 'PEEP',
      frecuencia: 'Frecuencia Respiratoria',
      inspiracionEspiracion: 'Relación I:E',
      pausaInspiratoria: 'Pausa Inspiratoria',
      pausaEspiratoria: 'Pausa Espiratoria',
      qMax: 'Flujo Máximo'
    };
    return names[key] || key;
  }

  /**
   * Obtener unidad de parámetro
   */
  private getUnit(key: string): string {
    const units: Record<string, string> = {
      fio2: '%',
      volumen: 'ml',
      presionMax: 'cmH2O',
      peep: 'cmH2O',
      frecuencia: 'resp/min',
      inspiracionEspiracion: '',
      pausaInspiratoria: 's',
      pausaEspiratoria: 's',
      qMax: 'L/min'
    };
    return units[key] || '';
  }

  /**
   * Verificar rate limiting
   */
  private checkRateLimit(providerName: string): { allowed: boolean; retryAfter?: number } {
    if (!this.rateLimitConfig[providerName]) {
      return { allowed: true };
    }

    const config = this.rateLimitConfig[providerName];
    const now = Date.now();
    const windowStart = now - config.window;
    
    // Filtrar requests dentro de la ventana de tiempo
    const recentRequests = this.requestHistory.filter(req => 
      req.provider === providerName && req.timestamp > windowStart
    );

    if (recentRequests.length >= config.requests) {
      const oldestRequest = Math.min(...recentRequests.map(req => req.timestamp));
      const retryAfter = (oldestRequest + config.window) - now;
      
      return {
        allowed: false,
        retryAfter: Math.max(0, retryAfter),
      };
    }

    return { allowed: true };
  }

  /**
   * Registrar solicitud
   */
  private recordRequest(providerName: string, success: boolean, responseTime: number, error: any = null) {
    const request = {
      timestamp: Date.now(),
      provider: providerName,
      success,
      responseTime,
      error: error?.message || null
    };

    this.requestHistory.push(request);

    // Mantener solo el historial reciente
    if (this.requestHistory.length > this.maxHistorySize) {
      this.requestHistory = this.requestHistory.slice(-this.maxHistorySize);
    }

    // Actualizar rate limits
    if (!this.rateLimits.has(providerName)) {
      this.rateLimits.set(providerName, {
        requests: 0,
        errors: 0,
        totalResponseTime: 0,
        lastRequest: null
      });
    }

    const rateLimit = this.rateLimits.get(providerName);
    rateLimit.requests++;
    rateLimit.totalResponseTime += responseTime;
    rateLimit.lastRequest = Date.now();

    if (!success) {
      rateLimit.errors++;
    }
  }

  /**
   * Obtener estadísticas globales
   */
  getProviderStats() {
    const stats = {
      currentProvider: this.currentProvider?.name || null,
      availableProviders: Array.from(this.providers.keys()),
      totalProviders: this.providers.size,
      fallbackChain: this.fallbackChain,
      globalStats: {
        totalRequests: this.requestHistory.length,
        successfulRequests: this.requestHistory.filter(req => req.success).length,
        failedRequests: this.requestHistory.filter(req => !req.success).length,
        averageResponseTime: this.calculateAverageResponseTime(),
        lastRequest: this.requestHistory.length > 0 ? 
          new Date(Math.max(...this.requestHistory.map(req => req.timestamp))) : null
      },
      providerStats: {} as Record<string, any>,
      rateLimits: {} as Record<string, any>
    };

    // Estadísticas por provider
    for (const [name, provider] of this.providers) {
      if (typeof provider.getStats === 'function') {
        stats.providerStats[name] = provider.getStats();
      }
    }

    // Rate limits por provider
    for (const [name, config] of Object.entries(this.rateLimitConfig)) {
      const rateLimitData = this.rateLimits.get(name);
      const recentRequests = this.requestHistory.filter(req => 
        req.provider === name && 
        req.timestamp > (Date.now() - config.window)
      );

      stats.rateLimits[name] = {
        config,
        current: recentRequests.length,
        limit: config.requests,
        remaining: Math.max(0, config.requests - recentRequests.length),
        resetTime: rateLimitData?.lastRequest ? 
          new Date(rateLimitData.lastRequest + config.window) : null
      };
    }

    return stats;
  }

  /**
   * Calcular tiempo de respuesta promedio
   */
  private calculateAverageResponseTime(): number {
    const successfulRequests = this.requestHistory.filter(req => req.success);
    if (successfulRequests.length === 0) return 0;
    
    const totalTime = successfulRequests.reduce((sum, req) => sum + req.responseTime, 0);
    return totalTime / successfulRequests.length;
  }

  /**
   * Obtener proveedor actual
   */
  getCurrentProvider() {
    return this.currentProvider;
  }

  /**
   * Obtener proveedores disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Verificar si un proveedor está disponible
   */
  isProviderAvailable(providerName: string): boolean {
    return this.providers.has(providerName) && 
           this.providers.get(providerName).isAvailable();
  }

  /**
   * Reiniciar rate limits para un proveedor
   */
  resetRateLimit(providerName: string) {
    this.rateLimits.delete(providerName);
  }

  /**
   * Obtener historial de requests
   */
  getRequestHistory(limit: number = 50) {
    return this.requestHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Instancia singleton
export const aiServiceManager = new AIServiceManager();

export default aiServiceManager;

