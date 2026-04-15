/**
 * quiz.service.ts
 * ===============
 * Business logic for the Quiz endpoints.
 *
 * Covers:
 *  - Listing quizzes by moduleId
 *  - Fetching a single quiz with questions
 *  - Grading a quiz attempt and persisting it
 */

import { prisma } from '../../shared/infrastructure/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'scenario_choice';
  text: string;
  options: QuizOption[];
  explanation?: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string;
}

export interface GradedQuestion {
  questionId: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation?: string;
  feedback?: string; // per-option feedback (talleres)
}

export interface AttemptResult {
  attemptId: string;
  score: number;           // 0-100
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  gradedQuestions: GradedQuestion[];
}

// ─── List all active quizzes ──────────────────────────────────────────────────

export async function getAllQuizzes() {
  return prisma.quiz.findMany({
    where:   { isActive: true },
    select:  {
      id:          true,
      title:       true,
      description: true,
      moduleId:    true,
      passingScore: true,
      timeLimit:   true,
      order:       true,
      createdAt:   true,
    },
    orderBy: [{ moduleId: 'asc' }, { order: 'asc' }],
  });
}

// ─── List quizzes for a module ────────────────────────────────────────────────

export async function getQuizzesByModule(moduleId: string) {
  return prisma.quiz.findMany({
    where:   { moduleId, isActive: true },
    select:  {
      id:          true,
      title:       true,
      description: true,
      moduleId:    true,
      passingScore: true,
      timeLimit:   true,
      order:       true,
      createdAt:   true,
      // Exclude questions — callers fetch the full quiz separately
    },
    orderBy: { order: 'asc' },
  });
}

// ─── Fetch a single quiz (with questions) ─────────────────────────────────────

export async function getQuizById(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
  });
}

// ─── Grade an attempt ─────────────────────────────────────────────────────────

export async function gradeQuizAttempt(
  userId:  string,
  quizId:  string,
  answers: UserAnswer[]
): Promise<AttemptResult> {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

  if (!quiz) throw new Error(`Quiz not found: ${quizId}`);

  const questions = quiz.questions as unknown as QuizQuestion[];
  let correct = 0;
  const gradedQuestions: GradedQuestion[] = [];

  for (const question of questions) {
    const userAnswer = answers.find((a) => a.questionId === question.id);
    const correctOpt = question.options.find((o) => o.isCorrect);
    const selectedOpt = userAnswer
      ? question.options.find((o) => o.id === userAnswer.selectedOptionId)
      : undefined;

    const isCorrect = !!selectedOpt?.isCorrect;
    if (isCorrect) correct++;

    gradedQuestions.push({
      questionId:       question.id,
      selectedOptionId: userAnswer?.selectedOptionId ?? '',
      correctOptionId:  correctOpt?.id ?? '',
      isCorrect,
      explanation:      question.explanation,
      feedback:         selectedOpt?.feedback,
    });
  }

  const totalQuestions = questions.length;
  const score   = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const passed  = score >= quiz.passingScore;

  // Persist the attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      score,
      passed,
      answers: answers as any,
      completedAt: new Date(),
    },
  });

  return {
    attemptId:      attempt.id,
    score,
    passed,
    totalQuestions,
    correctAnswers: correct,
    gradedQuestions,
  };
}
