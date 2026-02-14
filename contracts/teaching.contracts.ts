/**
 * VENTYLAB - TEACHING MODULE CONTRACTS
 * Backend contracts for educational content management
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Learning difficulty levels
 */
export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

/**
 * Content types for lessons
 */
export enum ContentType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  IMAGE = 'IMAGE',
  INTERACTIVE = 'INTERACTIVE',
  SIMULATION = 'SIMULATION',
  QUIZ = 'QUIZ',
  CLINICAL_CASE = 'CLINICAL_CASE',
}

/**
 * Step types within a lesson
 */
export enum StepType {
  THEORY = 'THEORY',
  EXAMPLE = 'EXAMPLE',
  PRACTICE = 'PRACTICE',
  SUMMARY = 'SUMMARY',
}

/**
 * Module status
 */
export enum ModuleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * User progress status for modules
 */
export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Learning level (Beginner, Intermediate, Advanced)
 */
export interface Level {
  /** Level ID */
  id: string;
  
  /** Level title */
  title: string;
  
  /** Display order */
  order: number;
  
  /** Level description */
  description: string;
  
  /** Difficulty level */
  difficulty: DifficultyLevel;
  
  /** Estimated total hours */
  estimatedHours?: number;
  
  /** Prerequisites */
  prerequisites?: string[];
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Module within a level
 */
export interface Module {
  /** Module ID */
  id: string;
  
  /** Level ID this module belongs to */
  levelId: string;
  
  /** Module title */
  title: string;
  
  /** Module description */
  description: string;
  
  /** Difficulty level */
  difficulty: DifficultyLevel;
  
  /** Display order within level */
  order: number;
  
  /** Module status */
  status: ModuleStatus;
  
  /** Estimated time in minutes */
  estimatedMinutes?: number;
  
  /** Prerequisites (module IDs) */
  prerequisites?: string[];
  
  /** Learning objectives */
  learningObjectives?: string[];
  
  /** Cover image URL */
  coverImage?: string;
  
  /** Icon name */
  icon?: string;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Lesson within a module
 */
export interface Lesson {
  /** Lesson ID */
  id: string;
  
  /** Module ID this lesson belongs to */
  moduleId: string;
  
  /** Lesson title */
  title: string;
  
  /** Lesson content (markdown or JSON) */
  content: string;
  
  /** Display order within module */
  order: number;
  
  /** Estimated time in minutes */
  estimatedMinutes: number;
  
  /** Whether lesson has required quiz */
  hasRequiredQuiz: boolean;
  
  /** Whether lesson has required clinical case */
  hasRequiredCase: boolean;
  
  /** Learning objectives for this lesson */
  objectives?: string[];
  
  /** Key concepts */
  keyConcepts?: string[];
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Step within a lesson (for structured content)
 */
export interface Step {
  /** Step ID */
  id: string;
  
  /** Lesson ID this step belongs to */
  lessonId: string;
  
  /** Step title */
  title: string;
  
  /** Step type */
  type: StepType;
  
  /** Step content */
  content: string;
  
  /** Content type */
  contentType: ContentType;
  
  /** Display order */
  order: number;
  
  /** Media URL (for images, videos) */
  mediaUrl?: string;
  
  /** Duration in seconds (for videos, animations) */
  duration?: number;
  
  /** Interactive data (for simulations, quizzes) */
  interactiveData?: any;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * User progress for a module
 */
export interface UserProgress {
  /** Progress ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Module ID */
  moduleId: string;
  
  /** Progress status */
  status: ProgressStatus;
  
  /** Number of completed lessons */
  completedLessonsCount: number;
  
  /** Total lessons in module */
  totalLessonsCount: number;
  
  /** Progress percentage (0-100) */
  progressPercentage: number;
  
  /** Started timestamp */
  startedAt?: Date;
  
  /** Completed timestamp */
  completedAt?: Date;
  
  /** Last accessed timestamp */
  lastAccessedAt?: Date;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Lesson completion record
 */
export interface LessonCompletion {
  /** Completion ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Lesson ID */
  lessonId: string;
  
  /** Whether lesson is completed */
  completed: boolean;
  
  /** Completion timestamp */
  completedAt?: Date;
  
  /** Number of quiz attempts */
  quizAttempts: number;
  
  /** Best quiz score (0-100) */
  bestQuizScore?: number;
  
  /** Whether required quiz passed */
  quizPassed: boolean;
  
  /** Whether required case completed */
  caseCompleted: boolean;
  
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
 * Request to create a new level
 */
export interface CreateLevelRequest {
  /** Level title */
  title: string;
  
  /** Display order */
  order: number;
  
  /** Level description */
  description: string;
  
  /** Difficulty level */
  difficulty: DifficultyLevel;
  
  /** Estimated total hours */
  estimatedHours?: number;
  
  /** Prerequisites */
  prerequisites?: string[];
}

/**
 * Response after creating level
 */
export interface CreateLevelResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Created level */
  level: Level;
  
  /** Message */
  message: string;
}

/**
 * Request to create a new module
 */
export interface CreateModuleRequest {
  /** Level ID */
  levelId: string;
  
  /** Module title */
  title: string;
  
  /** Module description */
  description: string;
  
  /** Difficulty level */
  difficulty: DifficultyLevel;
  
  /** Display order */
  order: number;
  
  /** Module status */
  status?: ModuleStatus;
  
  /** Estimated time in minutes */
  estimatedMinutes?: number;
  
  /** Prerequisites */
  prerequisites?: string[];
  
  /** Learning objectives */
  learningObjectives?: string[];
  
  /** Cover image URL */
  coverImage?: string;
  
  /** Icon name */
  icon?: string;
}

/**
 * Response after creating module
 */
export interface CreateModuleResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Created module */
  module: Module;
  
  /** Message */
  message: string;
}

/**
 * Request to update a module
 */
export interface UpdateModuleRequest {
  /** Module ID */
  moduleId: string;
  
  /** Updated fields (partial) */
  updates: Partial<Omit<Module, 'id' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Response after updating module
 */
export interface UpdateModuleResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated module */
  module: Module;
  
  /** Message */
  message: string;
}

/**
 * Request to create a new lesson
 */
export interface CreateLessonRequest {
  /** Module ID */
  moduleId: string;
  
  /** Lesson title */
  title: string;
  
  /** Lesson content */
  content: string;
  
  /** Display order */
  order: number;
  
  /** Estimated time in minutes */
  estimatedMinutes: number;
  
  /** Whether has required quiz */
  hasRequiredQuiz?: boolean;
  
  /** Whether has required case */
  hasRequiredCase?: boolean;
  
  /** Learning objectives */
  objectives?: string[];
  
  /** Key concepts */
  keyConcepts?: string[];
}

/**
 * Response after creating lesson
 */
export interface CreateLessonResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Created lesson */
  lesson: Lesson;
  
  /** Message */
  message: string;
}

/**
 * Request to update a lesson
 */
export interface UpdateLessonRequest {
  /** Lesson ID */
  lessonId: string;
  
  /** Updated fields (partial) */
  updates: Partial<Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Response after updating lesson
 */
export interface UpdateLessonResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated lesson */
  lesson: Lesson;
  
  /** Message */
  message: string;
}

/**
 * Request to create a step
 */
export interface CreateStepRequest {
  /** Lesson ID */
  lessonId: string;
  
  /** Step title */
  title: string;
  
  /** Step type */
  type: StepType;
  
  /** Step content */
  content: string;
  
  /** Content type */
  contentType: ContentType;
  
  /** Display order */
  order: number;
  
  /** Media URL */
  mediaUrl?: string;
  
  /** Duration */
  duration?: number;
  
  /** Interactive data */
  interactiveData?: any;
}

/**
 * Response after creating step
 */
export interface CreateStepResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Created step */
  step: Step;
  
  /** Message */
  message: string;
}

/**
 * Request to get user progress
 */
export interface GetProgressRequest {
  /** User ID */
  userId: string;
  
  /** Optional level ID filter */
  levelId?: string;
  
  /** Optional module ID filter */
  moduleId?: string;
}

/**
 * Response with user progress
 */
export interface GetProgressResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** User progress records */
  progress: UserProgress[];
  
  /** Total modules */
  totalModules: number;
  
  /** Completed modules count */
  completedModulesCount: number;
  
  /** In progress modules count */
  inProgressModulesCount: number;
  
  /** Overall progress percentage */
  overallProgressPercentage: number;
  
  /** Message */
  message: string;
}

/**
 * Request to update user progress
 */
export interface UpdateProgressRequest {
  /** User ID */
  userId: string;
  
  /** Module ID */
  moduleId: string;
  
  /** Lesson ID (if completing specific lesson) */
  lessonId?: string;
  
  /** New status */
  status?: ProgressStatus;
  
  /** Increment completed lessons */
  incrementCompleted?: boolean;
}

/**
 * Response after updating progress
 */
export interface UpdateProgressResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated progress */
  progress: UserProgress;
  
  /** Lesson completion if lesson was completed */
  lessonCompletion?: LessonCompletion;
  
  /** Whether module was just completed */
  moduleJustCompleted: boolean;
  
  /** Message */
  message: string;
}

/**
 * Request to get lesson completion details
 */
export interface GetLessonCompletionRequest {
  /** User ID */
  userId: string;
  
  /** Module ID (optional, for filtering) */
  moduleId?: string;
  
  /** Lesson ID (optional, for specific lesson) */
  lessonId?: string;
}

/**
 * Response with lesson completions
 */
export interface GetLessonCompletionResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Lesson completion records */
  completions: LessonCompletion[];
  
  /** Total lessons */
  totalLessons: number;
  
  /** Completed lessons count */
  completedLessonsCount: number;
  
  /** Message */
  message: string;
}

/**
 * Request to get modules with progress
 */
export interface GetModulesWithProgressRequest {
  /** User ID */
  userId: string;
  
  /** Level ID (optional filter) */
  levelId?: string;
  
  /** Include archived modules */
  includeArchived?: boolean;
}

/**
 * Module with user progress data
 */
export interface ModuleWithProgress extends Module {
  /** User progress for this module */
  userProgress?: UserProgress;
  
  /** Lesson completions for this module */
  lessonCompletions?: LessonCompletion[];
  
  /** Total lessons in module */
  totalLessons: number;
  
  /** Completed lessons count */
  completedLessons: number;
}

/**
 * Response with modules and progress
 */
export interface GetModulesWithProgressResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Modules with progress data */
  modules: ModuleWithProgress[];
  
  /** Total modules */
  totalModules: number;
  
  /** Message */
  message: string;
}

/**
 * Request to delete a module
 */
export interface DeleteModuleRequest {
  /** Module ID */
  moduleId: string;
  
  /** Whether to force delete (remove all dependencies) */
  force?: boolean;
}

/**
 * Response after deleting module
 */
export interface DeleteModuleResponse {
  /** Whether deletion was successful */
  success: boolean;
  
  /** Message */
  message: string;
  
  /** Number of lessons deleted */
  lessonsDeleted?: number;
  
  /** Number of progress records affected */
  progressRecordsAffected?: number;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation rules for teaching content
 */
export const TEACHING_VALIDATION = {
  /** Title length limits */
  TITLE: { min: 3, max: 200 },
  
  /** Description length limits */
  DESCRIPTION: { min: 10, max: 1000 },
  
  /** Content length limits */
  CONTENT: { min: 50, max: 50000 },
  
  /** Estimated time limits in minutes */
  ESTIMATED_TIME: { min: 1, max: 480 },
  
  /** Order limits */
  ORDER: { min: 0, max: 1000 },
  
  /** Maximum prerequisites */
  MAX_PREREQUISITES: 10,
  
  /** Maximum learning objectives */
  MAX_OBJECTIVES: 15,
} as const;
