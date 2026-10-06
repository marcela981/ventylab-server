/*
 * Funcionalidad: Modelos de lectura de quizzes
 * Descripción: Estructuras de solo lectura de quizzes, preguntas (completas y sin respuestas), respuestas, intentos y resultado de calificación
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface QuizOption {
  readonly id: string;
  readonly text: string;
  readonly isCorrect: boolean;
  readonly feedback?: string;
}

export interface QuizQuestion {
  readonly id: string;
  readonly type: string;
  readonly text: string;
  readonly options: QuizOption[];
  readonly explanation?: string;
}

export interface PublicQuizOption {
  readonly id: string;
  readonly text: string;
}

export interface PublicQuizQuestion {
  readonly id: string;
  readonly type: string;
  readonly text: string;
  readonly options: PublicQuizOption[];
}

export interface QuizSummary {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly moduleId?: string;
  readonly passingScore: number;
  readonly timeLimit?: number;
  readonly order: number;
  readonly createdAt: Date;
}

export interface QuizDetail extends QuizSummary {
  readonly lessonId?: string;
  readonly questions: QuizQuestion[];
  readonly isActive: boolean;
  readonly updatedAt: Date;
}

export interface QuizDetailView extends QuizSummary {
  readonly lessonId?: string;
  readonly questions: QuizQuestion[] | PublicQuizQuestion[];
  readonly answersRevealed: boolean;
  readonly isActive: boolean;
  readonly updatedAt: Date;
}

export interface QuizAnswer {
  readonly questionId: string;
  readonly selectedOptionId: string;
}

export interface QuizAttemptSummary {
  readonly id: string;
  readonly quizId: string;
  readonly score: number;
  readonly passed: boolean;
  readonly completedAt?: Date;
}

export interface GradedQuestion {
  readonly questionId: string;
  readonly selectedOptionId: string;
  readonly correctOptionId: string;
  readonly isCorrect: boolean;
  readonly explanation?: string;
  readonly feedback?: string;
}

export interface QuizGrading {
  readonly score: number;
  readonly passed: boolean;
  readonly totalQuestions: number;
  readonly correctAnswers: number;
  readonly gradedQuestions: GradedQuestion[];
}
