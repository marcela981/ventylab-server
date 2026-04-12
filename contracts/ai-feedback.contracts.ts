/**
 * VENTYLAB - AI FEEDBACK MODULE CONTRACTS
 * Backend contracts for AI-powered educational feedback
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * AI providers
 */
export enum AIProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE = 'GOOGLE',
  CUSTOM = 'CUSTOM',
}

/**
 * Feedback context types
 */
export enum FeedbackContext {
  LESSON = 'LESSON',
  EVALUATION = 'EVALUATION',
  SIMULATOR = 'SIMULATOR',
  CLINICAL_CASE = 'CLINICAL_CASE',
  GENERAL = 'GENERAL',
}

/**
 * Message roles
 */
export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * AI message
 */
export interface AIMessage {
  /** Message ID */
  id: string;
  
  /** Message role */
  role: MessageRole;
  
  /** Message content */
  content: string;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * AI conversation/session
 */
export interface AIConversation {
  /** Conversation ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Context type */
  contextType: FeedbackContext;
  
  /** Context ID (lesson, evaluation, etc.) */
  contextId?: string;
  
  /** Provider used */
  provider: AIProvider;
  
  /** Messages */
  messages: AIMessage[];
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Feedback context data
 */
export interface FeedbackContextData {
  /** Context type */
  type: FeedbackContext;
  
  /** Module information */
  module?: {
    id: string;
    title: string;
    difficulty: string;
  };
  
  /** Lesson information */
  lesson?: {
    id: string;
    title: string;
    content: string;
    objectives?: string[];
  };
  
  /** Evaluation information */
  evaluation?: {
    id: string;
    title: string;
    type: string;
    questions: any[];
    userAnswers: any[];
    score?: number;
  };
  
  /** Simulator information */
  simulator?: {
    sessionId?: string;
    parameters: any;
    readings: any[];
    clinicalCase?: any;
  };
  
  /** Clinical case information */
  clinicalCase?: {
    id: string;
    title: string;
    description: string;
    patientData: any;
  };
  
  /** User progress */
  userProgress?: {
    completedModules: number;
    totalModules: number;
    averageScore?: number;
  };
}

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  /** Provider name */
  provider: AIProvider;
  
  /** API key */
  apiKey: string;
  
  /** Model name */
  model: string;
  
  /** Temperature */
  temperature?: number;
  
  /** Max tokens */
  maxTokens?: number;
  
  /** Additional options */
  options?: any;
}

// ============================================================================
// DOMAIN INTERFACES (PORTS)
// ============================================================================

/**
 * AI provider interface
 * Abstraction for different AI service providers
 */
export interface IAIProvider {
  /**
   * Generate response from AI
   * @param messages - Conversation messages
   * @param context - Feedback context
   * @returns AI response
   */
  generateResponse(messages: AIMessage[], context: FeedbackContextData): Promise<string>;
  
  /**
   * Generate streaming response
   * @param messages - Conversation messages
   * @param context - Feedback context
   * @param onChunk - Callback for each chunk
   * @returns Promise that resolves when complete
   */
  generateStreamResponse(
    messages: AIMessage[],
    context: FeedbackContextData,
    onChunk: (chunk: string) => void
  ): Promise<void>;
  
  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
  
  /**
   * Get provider name
   */
  getProviderName(): AIProvider;
}

/**
 * Prompt builder interface
 * Constructs prompts for different contexts
 */
export interface IPromptBuilder {
  /**
   * Build system prompt
   * @param context - Feedback context
   * @returns System prompt
   */
  buildSystemPrompt(context: FeedbackContextData): string;
  
  /**
   * Build user prompt
   * @param userInput - User's question/input
   * @param context - Feedback context
   * @returns User prompt
   */
  buildUserPrompt(userInput: string, context: FeedbackContextData): string;
  
  /**
   * Format context for AI
   * @param context - Feedback context
   * @returns Formatted context string
   */
  formatContext(context: FeedbackContextData): string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to generate AI feedback
 */
export interface GenerateFeedbackRequest {
  /** User ID */
  userId: string;
  
  /** User input/question */
  userInput: string;
  
  /** Context data */
  context: FeedbackContextData;
  
  /** AI provider */
  provider?: AIProvider;
  
  /** Conversation ID (for continuing conversation) */
  conversationId?: string;
  
  /** Whether to stream response */
  stream?: boolean;
}

/**
 * Response with AI feedback
 */
export interface GenerateFeedbackResponse {
  /** Whether generation was successful */
  success: boolean;
  
  /** AI feedback */
  feedback: string;
  
  /** Provider used */
  provider: AIProvider;
  
  /** Conversation ID */
  conversationId: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Token usage (if available) */
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  
  /** Message */
  message: string;
}

/**
 * Request to get conversation history
 */
export interface GetConversationRequest {
  /** User ID */
  userId: string;
  
  /** Conversation ID */
  conversationId: string;
}

/**
 * Response with conversation history
 */
export interface GetConversationResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Conversation data */
  conversation: AIConversation;
  
  /** Message */
  message: string;
}

/**
 * Request to get user conversations
 */
export interface GetConversationsRequest {
  /** User ID */
  userId: string;
  
  /** Context type filter */
  contextType?: FeedbackContext;
  
  /** Page number */
  page?: number;
  
  /** Page size */
  limit?: number;
}

/**
 * Response with conversations list
 */
export interface GetConversationsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Conversations */
  conversations: AIConversation[];
  
  /** Total count */
  total: number;
  
  /** Current page */
  page: number;
  
  /** Page size */
  limit: number;
  
  /** Message */
  message: string;
}

/**
 * Request to delete conversation
 */
export interface DeleteConversationRequest {
  /** User ID */
  userId: string;
  
  /** Conversation ID */
  conversationId: string;
}

/**
 * Response after deleting conversation
 */
export interface DeleteConversationResponse {
  /** Whether deletion was successful */
  success: boolean;
  
  /** Message */
  message: string;
}

/**
 * Request to evaluate ventilator configuration
 */
export interface EvaluateConfigurationRequest {
  /** User ID */
  userId: string;
  
  /** User's ventilator configuration */
  userConfig: any;
  
  /** Expert/expected configuration */
  expertConfig: any;
  
  /** Clinical case context */
  clinicalCase?: any;
  
  /** AI provider */
  provider?: AIProvider;
}

/**
 * Response with configuration evaluation
 */
export interface EvaluateConfigurationResponse {
  /** Whether evaluation was successful */
  success: boolean;
  
  /** Evaluation score (0-100) */
  score: number;
  
  /** Detailed feedback */
  feedback: string;
  
  /** Parameter comparison */
  parameterComparison: {
    parameter: string;
    userValue: any;
    expertValue: any;
    difference: number;
    acceptable: boolean;
    feedback: string;
  }[];
  
  /** Overall assessment */
  assessment: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  
  /** Recommendations */
  recommendations: string[];
  
  /** Provider used */
  provider: AIProvider;
  
  /** Message */
  message: string;
}

/**
 * Request to get learning suggestions
 */
export interface GetLearningSuggestionsRequest {
  /** User ID */
  userId: string;
  
  /** User's progress data */
  userProgress: any;
  
  /** AI provider */
  provider?: AIProvider;
}

/**
 * Response with learning suggestions
 */
export interface GetLearningSuggestionsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Suggested modules */
  suggestedModules: {
    moduleId: string;
    moduleTitle: string;
    reason: string;
    priority: number;
  }[];
  
  /** Learning path recommendations */
  learningPath: string;
  
  /** Strengths identified */
  strengths: string[];
  
  /** Areas for improvement */
  areasForImprovement: string[];
  
  /** Provider used */
  provider: AIProvider;
  
  /** Message */
  message: string;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation rules for AI feedback
 */
export const AI_FEEDBACK_VALIDATION = {
  /** User input length limits */
  USER_INPUT: { min: 1, max: 5000 },
  
  /** Max messages per conversation */
  MAX_MESSAGES: 100,
  
  /** Max conversations per user */
  MAX_CONVERSATIONS: 50,
  
  /** Allowed providers */
  ALLOWED_PROVIDERS: [AIProvider.OPENAI, AIProvider.ANTHROPIC, AIProvider.GOOGLE, AIProvider.CUSTOM],
  
  /** Default temperature */
  DEFAULT_TEMPERATURE: 0.7,
  
  /** Default max tokens */
  DEFAULT_MAX_TOKENS: 2000,
  
  /** Rate limits (requests per minute) */
  RATE_LIMIT: {
    [AIProvider.OPENAI]: 20,
    [AIProvider.ANTHROPIC]: 20,
    [AIProvider.GOOGLE]: 20,
    [AIProvider.CUSTOM]: 10,
  },
} as const;

/**
 * System prompts for different contexts
 */
export const SYSTEM_PROMPTS = {
  BASE: `Eres un tutor experto en ventilación mecánica para estudiantes de medicina, enfermería y fisioterapia. 
Tu objetivo es proporcionar retroalimentación educativa clara, precisa y alentadora en español.
Siempre enfócate en el aprendizaje y la comprensión de conceptos.`,
  
  LESSON: `Estás ayudando a un estudiante a comprender una lección específica sobre ventilación mecánica.
Explica conceptos de manera clara y proporciona ejemplos cuando sea necesario.`,
  
  EVALUATION: `Estás proporcionando retroalimentación sobre una evaluación completada.
Explica las respuestas correctas, identifica áreas de mejora y sugiere temas para repasar.`,
  
  SIMULATOR: `Estás analizando una configuración de ventilador mecánico realizada por un estudiante.
Evalúa los parámetros, explica si son apropiados para el caso clínico y proporciona recomendaciones.`,
  
  CLINICAL_CASE: `Estás ayudando a un estudiante a resolver un caso clínico de ventilación mecánica.
Guía el razonamiento clínico sin dar la respuesta directamente. Haz preguntas que promuevan el pensamiento crítico.`,
} as const;
