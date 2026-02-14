/**
 * VENTYLAB - ADMIN MODULE CONTRACTS
 * Backend contracts for user management, groups, and analytics
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * User roles
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
  SUPERUSER = 'SUPERUSER',
}

/**
 * Account status
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

/**
 * Analytics period
 */
export enum AnalyticsPeriod {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
  ALL_TIME = 'ALL_TIME',
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * User entity
 */
export interface User {
  /** User ID */
  id: string;
  
  /** Email address */
  email: string;
  
  /** Full name */
  name: string;
  
  /** User role */
  role: UserRole;
  
  /** Account status */
  status: AccountStatus;
  
  /** Group ID (for students) */
  groupId?: string;
  
  /** Assigned teacher ID (for students) */
  assignedTeacherId?: string;
  
  /** Phone number */
  phone?: string;
  
  /** Department/Faculty */
  department?: string;
  
  /** Bio */
  bio?: string;
  
  /** Avatar URL */
  avatar?: string;
  
  /** Email verified */
  emailVerified: boolean;
  
  /** Last login timestamp */
  lastLoginAt?: Date;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Group/Class entity
 */
export interface Group {
  /** Group ID */
  id: string;
  
  /** Group name */
  name: string;
  
  /** Group description */
  description?: string;
  
  /** Teacher ID */
  teacherId: string;
  
  /** Semester/period */
  semester?: string;
  
  /** Academic year */
  academicYear?: string;
  
  /** Group code (for enrollment) */
  enrollmentCode?: string;
  
  /** Max students */
  maxStudents?: number;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Student with progress data
 */
export interface StudentWithProgress extends User {
  /** Group information */
  group?: Group;
  
  /** Assigned teacher */
  assignedTeacher?: Pick<User, 'id' | 'name' | 'email'>;
  
  /** Overall progress percentage */
  overallProgress: number;
  
  /** Completed modules count */
  completedModules: number;
  
  /** Total modules count */
  totalModules: number;
  
  /** Average evaluation score */
  averageScore?: number;
  
  /** Total evaluations taken */
  evaluationsTaken: number;
  
  /** Total evaluations passed */
  evaluationsPassed: number;
  
  /** Last activity timestamp */
  lastActivityAt?: Date;
}

/**
 * Detailed student progress
 */
export interface StudentDetailedProgress {
  /** User information */
  user: User;
  
  /** Module progress */
  moduleProgress: {
    moduleId: string;
    moduleTitle: string;
    status: string;
    progressPercentage: number;
    completedLessons: number;
    totalLessons: number;
    lastAccessedAt?: Date;
  }[];
  
  /** Evaluation attempts */
  evaluationAttempts: {
    evaluationId: string;
    evaluationTitle: string;
    attemptNumber: number;
    score: number;
    passed: boolean;
    submittedAt: Date;
  }[];
  
  /** Simulator sessions */
  simulatorSessions: {
    sessionId: string;
    isRealVentilator: boolean;
    duration: number;
    createdAt: Date;
  }[];
  
  /** Statistics */
  statistics: {
    totalTimeSpent: number; // minutes
    averageScore: number;
    completionRate: number;
    evaluationsPassRate: number;
    simulatorSessionsCount: number;
  };
}

/**
 * Group statistics
 */
export interface GroupStatistics {
  /** Group information */
  group: Group;
  
  /** Total students */
  totalStudents: number;
  
  /** Active students (accessed in last 30 days) */
  activeStudents: number;
  
  /** Average progress percentage */
  averageProgress: number;
  
  /** Average evaluation score */
  averageEvaluationScore: number;
  
  /** Completion rate (students who completed all modules) */
  completionRate: number;
  
  /** Pass rate (evaluations) */
  evaluationPassRate: number;
  
  /** Total time spent (all students, in hours) */
  totalTimeSpent: number;
  
  /** Progress distribution */
  progressDistribution: {
    range: string; // "0-20%", "21-40%", etc.
    count: number;
  }[];
  
  /** Module completion rates */
  moduleCompletionRates: {
    moduleId: string;
    moduleTitle: string;
    completionRate: number;
  }[];
}

/**
 * Platform-wide statistics
 */
export interface PlatformStatistics {
  /** Total users by role */
  usersByRole: {
    students: number;
    teachers: number;
    admins: number;
  };
  
  /** Active users (last 30 days) */
  activeUsers: {
    total: number;
    students: number;
    teachers: number;
  };
  
  /** Content statistics */
  content: {
    totalModules: number;
    publishedModules: number;
    totalLessons: number;
    totalEvaluations: number;
  };
  
  /** Learning statistics */
  learning: {
    totalEnrollments: number;
    averageProgress: number;
    completionRate: number;
    totalTimeSpent: number; // hours
  };
  
  /** Evaluation statistics */
  evaluations: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
  };
  
  /** Simulator usage */
  simulator: {
    totalSessions: number;
    realVentilatorSessions: number;
    averageSessionDuration: number; // minutes
  };
  
  /** Period */
  period: AnalyticsPeriod;
  
  /** Generated at */
  generatedAt: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to get students with filters
 */
export interface GetStudentsRequest {
  /** Group ID filter */
  groupId?: string;
  
  /** Assigned teacher ID filter */
  teacherId?: string;
  
  /** Search query (name or email) */
  search?: string;
  
  /** Status filter */
  status?: AccountStatus;
  
  /** Sort by field */
  sortBy?: 'name' | 'email' | 'progress' | 'lastActivity' | 'createdAt';
  
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  
  /** Page number */
  page?: number;
  
  /** Page size */
  limit?: number;
}

/**
 * Response with students list
 */
export interface GetStudentsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Students with progress */
  students: StudentWithProgress[];
  
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
 * Request to get detailed student progress
 */
export interface GetStudentProgressRequest {
  /** Student user ID */
  studentId: string;
}

/**
 * Response with detailed student progress
 */
export interface GetStudentProgressResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Detailed progress data */
  progress: StudentDetailedProgress;
  
  /** Message */
  message: string;
}

/**
 * Request to create user
 */
export interface CreateUserRequest {
  /** Email address */
  email: string;
  
  /** Full name */
  name: string;
  
  /** Password */
  password: string;
  
  /** User role */
  role: UserRole;
  
  /** Group ID (for students) */
  groupId?: string;
  
  /** Assigned teacher ID (for students) */
  assignedTeacherId?: string;
  
  /** Phone */
  phone?: string;
  
  /** Department */
  department?: string;
}

/**
 * Response after creating user
 */
export interface CreateUserResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Created user */
  user: Omit<User, 'emailVerified' | 'lastLoginAt'>;
  
  /** Message */
  message: string;
}

/**
 * Request to update user
 */
export interface UpdateUserRequest {
  /** User ID */
  userId: string;
  
  /** Updated fields */
  updates: Partial<Pick<User, 'name' | 'email' | 'role' | 'status' | 'groupId' | 'assignedTeacherId' | 'phone' | 'department' | 'bio' | 'avatar'>>;
}

/**
 * Response after updating user
 */
export interface UpdateUserResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated user */
  user: User;
  
  /** Message */
  message: string;
}

/**
 * Request to delete user
 */
export interface DeleteUserRequest {
  /** User ID */
  userId: string;
  
  /** Whether to delete all related data */
  deleteRelatedData?: boolean;
}

/**
 * Response after deleting user
 */
export interface DeleteUserResponse {
  /** Whether deletion was successful */
  success: boolean;
  
  /** Message */
  message: string;
  
  /** Number of related records deleted */
  relatedRecordsDeleted?: number;
}

/**
 * Request to create group
 */
export interface CreateGroupRequest {
  /** Group name */
  name: string;
  
  /** Group description */
  description?: string;
  
  /** Teacher ID */
  teacherId: string;
  
  /** Semester */
  semester?: string;
  
  /** Academic year */
  academicYear?: string;
  
  /** Max students */
  maxStudents?: number;
}

/**
 * Response after creating group
 */
export interface CreateGroupResponse {
  /** Whether creation was successful */
  success: boolean;
  
  /** Created group */
  group: Group;
  
  /** Enrollment code */
  enrollmentCode: string;
  
  /** Message */
  message: string;
}

/**
 * Request to update group
 */
export interface UpdateGroupRequest {
  /** Group ID */
  groupId: string;
  
  /** Updated fields */
  updates: Partial<Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Response after updating group
 */
export interface UpdateGroupResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated group */
  group: Group;
  
  /** Message */
  message: string;
}

/**
 * Request to delete group
 */
export interface DeleteGroupRequest {
  /** Group ID */
  groupId: string;
  
  /** What to do with students (reassign or delete) */
  studentAction?: 'reassign' | 'unassign';
  
  /** New group ID (if reassigning) */
  newGroupId?: string;
}

/**
 * Response after deleting group
 */
export interface DeleteGroupResponse {
  /** Whether deletion was successful */
  success: boolean;
  
  /** Message */
  message: string;
  
  /** Number of students affected */
  studentsAffected: number;
}

/**
 * Request to assign students to group
 */
export interface AssignStudentsToGroupRequest {
  /** Group ID */
  groupId: string;
  
  /** Student user IDs */
  studentIds: string[];
}

/**
 * Response after assigning students
 */
export interface AssignStudentsToGroupResponse {
  /** Whether assignment was successful */
  success: boolean;
  
  /** Number of students assigned */
  studentsAssigned: number;
  
  /** Message */
  message: string;
}

/**
 * Request to assign teacher to students
 */
export interface AssignTeacherRequest {
  /** Teacher user ID */
  teacherId: string;
  
  /** Student user IDs */
  studentIds: string[];
}

/**
 * Response after assigning teacher
 */
export interface AssignTeacherResponse {
  /** Whether assignment was successful */
  success: boolean;
  
  /** Number of students assigned */
  studentsAssigned: number;
  
  /** Message */
  message: string;
}

/**
 * Request to get group statistics
 */
export interface GetGroupStatisticsRequest {
  /** Group ID */
  groupId: string;
  
  /** Period for analytics */
  period?: AnalyticsPeriod;
}

/**
 * Response with group statistics
 */
export interface GetGroupStatisticsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Statistics data */
  statistics: GroupStatistics;
  
  /** Message */
  message: string;
}

/**
 * Request to get platform statistics
 */
export interface GetPlatformStatisticsRequest {
  /** Period for analytics */
  period?: AnalyticsPeriod;
}

/**
 * Response with platform statistics
 */
export interface GetPlatformStatisticsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Statistics data */
  statistics: PlatformStatistics;
  
  /** Message */
  message: string;
}

/**
 * Request to get activity logs
 */
export interface GetActivityLogsRequest {
  /** User ID filter */
  userId?: string;
  
  /** Action type filter */
  actionType?: string;
  
  /** Start date */
  startDate?: Date;
  
  /** End date */
  endDate?: Date;
  
  /** Page number */
  page?: number;
  
  /** Page size */
  limit?: number;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  /** Log ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** User name */
  userName: string;
  
  /** Action type */
  actionType: string;
  
  /** Description */
  description: string;
  
  /** Metadata (JSON) */
  metadata?: any;
  
  /** IP address */
  ipAddress?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Timestamp */
  createdAt: Date;
}

/**
 * Response with activity logs
 */
export interface GetActivityLogsResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Activity logs */
  logs: ActivityLog[];
  
  /** Total count */
  total: number;
  
  /** Current page */
  page: number;
  
  /** Page size */
  limit: number;
  
  /** Message */
  message: string;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation rules for admin operations
 */
export const ADMIN_VALIDATION = {
  /** Name length limits */
  NAME: { min: 2, max: 100 },
  
  /** Email regex */
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  /** Password requirements */
  PASSWORD: {
    min: 8,
    max: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false,
  },
  
  /** Group name limits */
  GROUP_NAME: { min: 3, max: 100 },
  
  /** Max students per group */
  MAX_STUDENTS_PER_GROUP: 500,
  
  /** Page size limits */
  PAGE_SIZE: { min: 1, max: 100, default: 20 },
} as const;
