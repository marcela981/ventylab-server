/**
 * VENTYLAB - PROFILE MODULE CONTRACTS
 * Backend contracts for user profile management
 */

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * User profile (extended user information)
 */
export interface UserProfile {
  /** User ID */
  id: string;
  
  /** Email address */
  email: string;
  
  /** Full name */
  name: string;
  
  /** User role */
  role: string;
  
  /** Phone number */
  phone?: string;
  
  /** Department/Faculty */
  department?: string;
  
  /** Bio/Description */
  bio?: string;
  
  /** Avatar URL */
  avatar?: string;
  
  /** Email verified */
  emailVerified: boolean;
  
  /** Account created date */
  createdAt: Date;
  
  /** Last updated date */
  updatedAt: Date;
  
  /** Last login date */
  lastLoginAt?: Date;
}

/**
 * User preferences/settings
 */
export interface UserPreferences {
  /** User ID */
  userId: string;
  
  /** Language preference */
  language?: string;
  
  /** Timezone */
  timezone?: string;
  
  /** Theme preference */
  theme?: 'light' | 'dark' | 'auto';
  
  /** Email notifications enabled */
  emailNotifications: boolean;
  
  /** Push notifications enabled */
  pushNotifications: boolean;
  
  /** Newsletter subscription */
  newsletterSubscription: boolean;
  
  /** Data sharing consent */
  dataSharingConsent: boolean;
  
  /** Custom settings (JSON) */
  customSettings?: any;
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * User activity summary
 */
export interface UserActivitySummary {
  /** User ID */
  userId: string;
  
  /** Total modules started */
  modulesStarted: number;
  
  /** Total modules completed */
  modulesCompleted: number;
  
  /** Total lessons completed */
  lessonsCompleted: number;
  
  /** Total evaluations taken */
  evaluationsTaken: number;
  
  /** Total evaluations passed */
  evaluationsPassed: number;
  
  /** Total simulator sessions */
  simulatorSessions: number;
  
  /** Real ventilator sessions */
  realVentilatorSessions: number;
  
  /** Total time spent (minutes) */
  totalTimeSpent: number;
  
  /** Average score */
  averageScore?: number;
  
  /** Current streak (days) */
  currentStreak: number;
  
  /** Longest streak (days) */
  longestStreak: number;
  
  /** Last activity date */
  lastActivityAt?: Date;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to get user profile
 */
export interface GetProfileRequest {
  /** User ID */
  userId: string;
}

/**
 * Response with user profile
 */
export interface GetProfileResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** User profile */
  profile: UserProfile;
  
  /** User preferences */
  preferences?: UserPreferences;
  
  /** Activity summary */
  activitySummary?: UserActivitySummary;
  
  /** Message */
  message: string;
}

/**
 * Request to update profile
 */
export interface UpdateProfileRequest {
  /** User ID */
  userId: string;
  
  /** Name */
  name?: string;
  
  /** Phone */
  phone?: string;
  
  /** Department */
  department?: string;
  
  /** Bio */
  bio?: string;
  
  /** Avatar URL */
  avatar?: string;
}

/**
 * Response after updating profile
 */
export interface UpdateProfileResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated profile */
  profile: UserProfile;
  
  /** Message */
  message: string;
}

/**
 * Request to upload avatar
 */
export interface UploadAvatarRequest {
  /** User ID */
  userId: string;
  
  /** Image file (base64 or file) */
  file: any;
}

/**
 * Response after uploading avatar
 */
export interface UploadAvatarResponse {
  /** Whether upload was successful */
  success: boolean;
  
  /** Avatar URL */
  avatarUrl: string;
  
  /** Message */
  message: string;
}

/**
 * Request to change password
 */
export interface ChangePasswordRequest {
  /** User ID */
  userId: string;
  
  /** Current password */
  currentPassword: string;
  
  /** New password */
  newPassword: string;
}

/**
 * Response after changing password
 */
export interface ChangePasswordResponse {
  /** Whether change was successful */
  success: boolean;
  
  /** Message */
  message: string;
}

/**
 * Request to update email
 */
export interface UpdateEmailRequest {
  /** User ID */
  userId: string;
  
  /** New email */
  newEmail: string;
  
  /** Current password (for verification) */
  password: string;
}

/**
 * Response after updating email
 */
export interface UpdateEmailResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Message */
  message: string;
  
  /** Verification email sent */
  verificationSent: boolean;
}

/**
 * Request to update preferences
 */
export interface UpdatePreferencesRequest {
  /** User ID */
  userId: string;
  
  /** Updated preferences */
  preferences: Partial<Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>>;
}

/**
 * Response after updating preferences
 */
export interface UpdatePreferencesResponse {
  /** Whether update was successful */
  success: boolean;
  
  /** Updated preferences */
  preferences: UserPreferences;
  
  /** Message */
  message: string;
}

/**
 * Request to get activity summary
 */
export interface GetActivitySummaryRequest {
  /** User ID */
  userId: string;
  
  /** Period (optional) */
  period?: 'week' | 'month' | 'year' | 'all';
}

/**
 * Response with activity summary
 */
export interface GetActivitySummaryResponse {
  /** Whether request was successful */
  success: boolean;
  
  /** Activity summary */
  summary: UserActivitySummary;
  
  /** Recent activities */
  recentActivities?: {
    type: string;
    description: string;
    timestamp: Date;
  }[];
  
  /** Message */
  message: string;
}

/**
 * Request to delete account
 */
export interface DeleteAccountRequest {
  /** User ID */
  userId: string;
  
  /** Password (for confirmation) */
  password: string;
  
  /** Reason (optional) */
  reason?: string;
}

/**
 * Response after deleting account
 */
export interface DeleteAccountResponse {
  /** Whether deletion was successful */
  success: boolean;
  
  /** Message */
  message: string;
}

/**
 * Request to export user data (GDPR compliance)
 */
export interface ExportUserDataRequest {
  /** User ID */
  userId: string;
}

/**
 * Response with export data
 */
export interface ExportUserDataResponse {
  /** Whether export was successful */
  success: boolean;
  
  /** Export data (JSON) */
  data: {
    profile: UserProfile;
    preferences: UserPreferences;
    progress: any[];
    evaluations: any[];
    simulatorSessions: any[];
    activityLogs: any[];
  };
  
  /** Message */
  message: string;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Validation rules for profile operations
 */
export const PROFILE_VALIDATION = {
  /** Name length limits */
  NAME: { min: 2, max: 100 },
  
  /** Phone regex (international format) */
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  
  /** Bio length limits */
  BIO: { min: 0, max: 500 },
  
  /** Avatar file size limit (bytes) */
  AVATAR_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  
  /** Avatar allowed formats */
  AVATAR_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  
  /** Password requirements */
  PASSWORD: {
    min: 8,
    max: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: false,
  },
} as const;
