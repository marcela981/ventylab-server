/**
 * Profile Types
 */

export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  image?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
