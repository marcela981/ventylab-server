/**
 * VENTYLAB - EVALUATION MODULE CONTRACTS
 * Backend contracts for formal assessments and quizzes
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Types of evaluations
 */
export enum EvaluationType {
  QUIZ = 'QUIZ',
  EXAM = 'EXAM',
  WORKSHOP = 'WORKSHOP',
  CLINICAL_CASE = 'CLINICAL_CASE',
  SIMULATOR_PRACTICAL = 'SIMULATOR_PRACTICAL',
}

/**
 * Question types
 */
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
  MATCHING = 'MATCHING',
  FILL_BLANK = 'FILL_BLANK',
  SIMULATOR_CONFIG = 'SIMULATOR_CONFIG',
}

/**
 * Evaluation status
 */
export enum EvaluationStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Attempt status
 */
export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
  EXPIRED = 'EXPIRED',
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Answer option for multiple choice questions
 */
export interface AnswerOption {
  /** Option ID */
  id: string;
  
  /** Option text */
  text: string;
  
  /** Whether this is the correct answer */
  isCorrect: boolean;
  
  /** Explanation for this option (shown after submission) */
  explanation?: string;
}

/**
 * Question in an evaluation
 */
export interface Question {
  /** Question ID */
  id: string;
  
  /** Evaluation ID this question belongs to */
  evaluationId: string;
  
  /** Question type */
  type: QuestionType;
  
  /** Question text/prompt */
  text: string;
  
  /** Display order */
  order: number;
  
  /** Points awarded for correct answer */
  points: number;
  
  /** Answer options (for multiple choice, true/false) */
  options?: AnswerOption[];
  
  /** Correct answer (for short answer, fill blank) */
  correctAnswer?: string;
  
  /** Matching pairs (for matching questions) */
  matchingPairs?: { left: string; right: string }[];
  
  /** Expected simulator configuration (for simulator questions) */
  expectedConfig?: any;
  
  /** Allowed error margin for simulator questions */
  errorMargin?: number;
  
  /** Media URL (image, diagram, etc.) */
  mediaUrl?: string;
  
  /** Explanation (shown after submission) */
  explanation?: string;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Evaluation/Assessment
 */
export interface Evaluation {
  /** Evaluation ID */
  id: string;
  
  /** Evaluation title */
  title: string;
  
  /** Evaluation description */
  description: string;
  
  /** Evaluation type */
  type: EvaluationType;
  
  /** Evaluation status */
  status: EvaluationStatus;
  
  /** Module ID (if associated with specific module) */
  moduleId?: string;
  
  /** Lesson ID (if associated with specific lesson) */
  lessonId?: string;
  
  /** Passing score percentage (0-100) */
  passingScore: number;
  
  /** Time limit in minutes (null = unlimited) */
  timeLimit?: number;
  
  /** Total points */
  totalPoints: number;
  
  /** Maximum attempts allowed (null = unlimited) */
  maxAttempts?: number;
  
  /** Whether to randomize question order */
  randomizeQuestions: boolean;
  
  /** Whether to randomize option order */
  randomizeOptions: boolean;
  
  /** Whether to show results immediately after submission */
  showResultsImmediately: boolean;
  
  /** Whether to show correct answers after submission */
  showCorrectAnswers: boolean;
  
  /** Instructions for students */
  instructions?: string;
  
  /** Created by user ID */
  createdBy: string;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Student's answer to a question
 */
export interface SubmittedAnswer {
  /** Question ID */
  questionId: string;
  
  /** Selected option ID (for multiple choice, true/false) */
  selectedOptionId?: string;
  
  /** Text answer (for short answer, essay) */
  textAnswer?: string;
  
  /** Selected pairs (for matching) */
  selectedPairs?: { left: string; right: string }[];
  
  /** Simulator configuration (for simulator questions) */
  simulatorConfig?: any;
  
  /** Whether answer is correct (computed) */
  isCorrect?: boolean;
  
  /** Points earned */
  pointsEarned?: number;
}

/**
 * Evaluation attempt by a student
 */
export interface EvaluationAttempt {
  /** Attempt ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Evaluation ID */
  evaluationId: string;
  
  /** Attempt number */
  attemptNumber: number;
  
  /** Attempt status */
  status: AttemptStatus;
  
  /** Submitted answers */
  answers: SubmittedAnswer[];
  
  /** Score achieved (0-100) */
  score?: number;
  
  /** Points earned */
  pointsEarned?: number;
  
  /** Total points */
  totalPoints: number;
  
  /** Whether attempt passed */
  passed?: boolean;
  
  /** AI-generated feedback */
  feedback?: string;
  
  /** Simulator data (if applicable) */
  simulatorData?: any;
  
  /** Started timestamp */
  startedAt: Date;
  
  /** Submitted timestamp */
  submittedAt?: Date;
  
  /** Graded timestamp */
  gradedAt?: Date;
  
  /** Time spent in minutes */
  timeSpentMinutes?: number;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to create evaluation
 */
export interface CreateEvaluationRequest {
  /** Evaluation title */
  title: string;
  
  /** Evaluation description */
  description: string;
  
  /** Evaluation type */
  type: EvaluationType;
  
  /** Module ID (optional) */
  moduleId?: string;
  
  /** Lesson ID (optional) */
  lessonId?: string;
  
  /** Passing score percentage */
  passingScore: number;
  
  /** Time limit in minutes */
  timeLimit?: number;
  
  /** Maximum attempts */
  maxAttempts?: number;
  
  /** Randomize questions */
  randomizeQuestions?: boolean;
  
  /** Randomize options */
  randomizeOptions?: boolean;
  
  /** Show results immediately */
  showResultsImmediately?: boolean;
  
  /** Show correct answers */
  showCorrectAnswers?: boolean;
  
  /** Instructions */
  instructions?: string;
  
  /** Questions */
  questions: Omit<Question, 'id' | 'evaluationId' | 'createdAt' | 'updatedAt'>[];
}

/**
 * Response after creating evaluation
 */
export interface CreateEvaluationResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Created evaluation */
  evaluation: Evaluation;
  
  /** Created questions */
  questions: Question[];
  
  /** Message */
  message: string;
}

/**
 * Request to update evaluation
 */
export interface UpdateEvaluationRequest {
  /** Evaluation ID */
  evaluationId: string;
  
  /** Updated fields (partial) */
  updates: Partial<Omit<Evaluation, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Response after updating evaluation
 */
export interface UpdateEvaluationResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated evaluation */
  evaluation: Evaluation;
  
  /** Message */
  message: string;
}

/**
 * Request to get evaluation (for students)
 */
export interface GetEvaluationRequest {
  /** Evaluation ID */
  evaluationId: string;
  
  /** User ID */
  userId: string;
}

/**
 * Evaluation for student (sanitized, no correct answers)
 */
export interface EvaluationForStudent extends Omit<Evaluation, 'createdBy'> {
  /** Questions (sanitized, no correct answers) */
  questions: Omit<Question, 'correctAnswer' | 'expectedConfig'>[];
  
  /** User's previous attempts */
  userAttempts: Pick<EvaluationAttempt, 'id' | 'attemptNumber' | 'score' | 'passed' | 'submittedAt'>[];
  
  /** Remaining attempts (null = unlimited) */
  remainingAttempts?: number;
  
  /** Whether user can start new attempt */
  canStartAttempt: boolean;
}

/**
 * Response with evaluation for student
 */
export interface GetEvaluationResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Evaluation data */
  evaluation: EvaluationForStudent;
  
  /** Message */
  message: string;
}

/**
 * Request to start evaluation attempt
 */
export interface StartAttemptRequest {
  /** Evaluation ID */
  evaluationId: string;
  
  /** User ID */
  userId: string;
}

/**
 * Response after starting attempt
 */
export interface StartAttemptResponse {
  /** Whether start was successful */
  success: boolean;
  
  /** Created attempt */
  attempt: EvaluationAttempt;
  
  /** Questions (randomized if configured) */
  questions: Omit<Question, 'correctAnswer' | 'expectedConfig'>[];
  
  /** Deadline timestamp (if time limit) */
  deadline?: number;
  
  /** Message */
  message: string;
}

/**
 * Request to submit evaluation attempt
 */
export interface SubmitAttemptRequest {
  /** Attempt ID */
  attemptId: string;
  
  /** User ID */
  userId: string;
  
  /** Submitted answers */
  answers: Omit<SubmittedAnswer, 'isCorrect' | 'pointsEarned'>[];
  
  /** Simulator data (if applicable) */
  simulatorData?: any;
}

/**
 * Response after submitting attempt
 */
export interface SubmitAttemptResponse {
  /** Whether submission was successful */
  success: boolean;
  
  /** Graded attempt */
  attempt: EvaluationAttempt;
  
  /** Score achieved */
  score: number;
  
  /** Points earned */
  pointsEarned: number;
  
  /** Total points */
  totalPoints: number;
  
  /** Whether passed */
  passed: boolean;
  
  /** AI-generated feedback */
  feedback?: string;
  
  /** Correct answers (if configured to show) */
  correctAnswers?: { questionId: string; correctAnswer: any }[];
  
  /** Message */
  message: string;
}

/**
 * Request to get evaluation results
 */
export interface GetResultsRequest {
  /** Evaluation ID */
  evaluationId: string;
  
  /** User ID */
  userId: string;
  
  /** Attempt ID (optional, for specific attempt) */
  attemptId?: string;
}

/**
 * Response with evaluation results
 */
export interface GetResultsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Evaluation details */
  evaluation: Pick<Evaluation, 'id' | 'title' | 'type' | 'passingScore' | 'totalPoints'>;
  
  /** Attempts */
  attempts: EvaluationAttempt[];
  
  /** Best attempt */
  bestAttempt?: EvaluationAttempt;
  
  /** Average score */
  averageScore?: number;
  
  /** Message */
  message: string;
}

/**
 * Request to get all evaluations (with filters)
 */
export interface GetEvaluationsRequest {
  /** User ID (for student view) */
  userId?: string;
  
  /** Module ID filter */
  moduleId?: string;
  
  /** Lesson ID filter */
  lessonId?: string;
  
  /** Type filter */
  type?: EvaluationType;
  
  /** Status filter */
  status?: EvaluationStatus;
  
  /** Include archived */
  includeArchived?: boolean;
  
  /** Page number */
  page?: number;
  
  /** Page size */
  limit?: number;
}

/**
 * Response with evaluations list
 */
export interface GetEvaluationsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Evaluations */
  evaluations: Evaluation[];
  
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
 * Request to delete evaluation
 */
export interface DeleteEvaluationRequest {
  /** Evaluation ID */
  evaluationId: string;
  
  /** Whether to delete attempts too */
  deleteAttempts?: boolean;
}

/**
 * Response after deleting evaluation
 */
export interface DeleteEvaluationResponse {
  /** Whether deletion was successful */
  success: boolean;
  
  /** Message */
  message: string;
  
  /** Number of attempts deleted */
  attemptsDeleted?: number;
}

/**
 * Request to get teacher's evaluation statistics
 */
export interface GetEvaluationStatsRequest {
  /** Evaluation ID */
  evaluationId: string;
}

/**
 * Response with evaluation statistics
 */
export interface GetEvaluationStatsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Evaluation details */
  evaluation: Pick<Evaluation, 'id' | 'title' | 'type' | 'passingScore' | 'totalPoints'>;
  
  /** Total attempts */
  totalAttempts: number;
  
  /** Total unique students */
  totalStudents: number;
  
  /** Average score */
  averageScore: number;
  
  /** Pass rate percentage */
  passRate: number;
  
  /** Score distribution */
  scoreDistribution: { range: string; count: number }[];
  
  /** Average time spent (minutes) */
  averageTimeSpent: number;
  
  /** Most missed questions */
  mostMissedQuestions: { questionId: string; questionText: string; missRate: number }[];
  
  /** Message */
  message: string;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation rules for evaluations
 */
export const EVALUATION_VALIDATION = {
  /** Title length limits */
  TITLE: { min: 3, max: 200 },
  
  /** Description length limits */
  DESCRIPTION: { min: 10, max: 1000 },
  
  /** Question text length */
  QUESTION_TEXT: { min: 5, max: 2000 },
  
  /** Passing score range */
  PASSING_SCORE: { min: 0, max: 100 },
  
  /** Time limit range (minutes) */
  TIME_LIMIT: { min: 1, max: 480 },
  
  /** Max attempts range */
  MAX_ATTEMPTS: { min: 1, max: 20 },
  
  /** Points range per question */
  POINTS_PER_QUESTION: { min: 1, max: 100 },
  
  /** Minimum questions per evaluation */
  MIN_QUESTIONS: 1,
  
  /** Maximum questions per evaluation */
  MAX_QUESTIONS: 100,
  
  /** Minimum options for multiple choice */
  MIN_OPTIONS: 2,
  
  /** Maximum options for multiple choice */
  MAX_OPTIONS: 10,
} as const;
