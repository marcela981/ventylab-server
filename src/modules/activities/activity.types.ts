export type ActivityType = 'EXAM' | 'QUIZ' | 'WORKSHOP' | 'TALLER';
export type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE';

export interface CreateActivityInput {
  title: string;
  description?: string | null;
  instructions?: string | null;
  type: ActivityType;
  maxScore?: number;
  timeLimit?: number | null; // minutes
  dueDate?: Date | string | null;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string | null;
  instructions?: string | null;
  type?: ActivityType;
  maxScore?: number;
  timeLimit?: number | null;
  dueDate?: Date | string | null;
  isActive?: boolean;
}

export interface AssignActivityToGroupInput {
  activityId: string;
  groupId: string;
  visibleFrom?: Date | string | null;
  dueDate?: Date | string | null;
  isActive?: boolean;
}

export interface SaveSubmissionInput {
  content: unknown;
}

export interface GradeSubmissionInput {
  score: number;
  feedback?: string | null;
}

