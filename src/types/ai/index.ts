// Tipos relacionados con servicios de IA

export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
  confidence?: number;
  tokensUsed?: number;
  responseTime?: number;
  model?: string;
  provider?: string;
  fallbackUsed?: boolean;
  originalProvider?: string;
}

export interface VentilatorAnalysisResult {
  success: boolean;
  analysis?: string;
  error?: string;
  recommendations?: string[];
  confidence?: number;
  responseTime?: number;
}

export interface AIProviderStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  averageConfidence: number;
  lastRequestTime: string | null;
  errors: Array<{
    timestamp: string;
    error: string;
    type: string;
    context?: string;
    stack?: string;
  }>;
  successRate?: number;
}

export interface AIProvider {
  name: string;
  initialize(): Promise<boolean>;
  isAvailable(): boolean;
  generateResponse(prompt: string, options?: any): Promise<AIResponse>;
  getStats(): AIProviderStats;
  analyzeVentilatorConfiguration?(
    userConfig: any,
    optimalConfig: any,
    ventilationMode: string,
    patientData?: any
  ): Promise<VentilatorAnalysisResult>;
}

export interface LessonContext {
  moduleId: string;
  lessonId: string;
  title: string;
  content: string;
  previousLessons?: string[];
  userProgress?: number;
}

export interface TutorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  context?: LessonContext;
}

export interface TutorPromptOptions {
  context?: LessonContext;
  conversationHistory?: TutorMessage[];
  tone?: 'formal' | 'friendly' | 'educational';
  language?: string;
}

export default {
  AIResponse,
  VentilatorAnalysisResult,
  AIProviderStats,
  AIProvider,
  LessonContext,
  TutorMessage,
  TutorPromptOptions
};

