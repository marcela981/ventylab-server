/**
 * AI Feedback Types
 */

export interface AIQuestion {
  question: string;
  context?: string;
  lessonId?: string;
  moduleId?: string;
}

export interface AIFeedbackRequest {
  answer: string;
  expectedAnswer?: string;
  context?: string;
}

export interface AIResponse {
  response: string;
  confidence?: number;
  sources?: string[];
}
