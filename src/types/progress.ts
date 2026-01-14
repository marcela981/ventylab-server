// Tipos para servicios de progreso

export interface UserProgress {
  userId: string;
  totalModules: number;
  completedModules: number;
  totalLessons: number;
  completedLessons: number;
  overallProgress: number; // Porcentaje 0-100
  lastActivity?: Date;
}

export interface ModuleProgress {
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
  completedLessons: number;
  progress: number; // Porcentaje 0-100
  lessons: LessonProgress[];
}

export interface LessonProgress {
  lessonId: string;
  lessonTitle: string;
  completed: boolean;
  progress: number; // Porcentaje 0-100
  lastAccessed?: Date;
  completedAt?: Date;
}

export interface UserStats {
  totalStudyTime: number; // En minutos
  currentStreak: number; // Días consecutivos
  longestStreak: number; // Racha más larga
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  lastActivityDate?: Date;
}

export interface LevelInfo {
  level: number;
  xpRequired: number;
  xpCurrent: number;
  xpToNext: number;
  progressToNext: number; // Porcentaje 0-100
}

export interface AchievementCondition {
  type: 'lessons_completed' | 'modules_completed' | 'quizzes_passed' | 'streak_days' | 'xp_reached' | 'perfect_score';
  value: number;
  target?: string; // ID de módulo, lección, etc.
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon?: string;
  condition: AchievementCondition;
  xpReward: number;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlockedAt: Date;
  xpReward: number;
}

export interface ProgressUpdateResult {
  success: boolean;
  progress?: {
    id: string;
    userId: string;
    moduleId?: string;
    lessonId?: string;
    completed: boolean;
    progress: number;
    completionPercentage?: number;
    updatedAt: Date;
  };
  xpGained?: number;
  levelUp?: {
    oldLevel: number;
    newLevel: number;
    xpGained: number;
  };
  achievementsUnlocked?: UnlockedAchievement[];
  error?: string;
}
