/**
 * Content Override Types
 *
 * Type definitions for the per-student content override system.
 * These types define the structure of override data and related interfaces.
 */

import { OverrideEntityType } from '../../config/constants';

// ============================================
// Override Data Structures
// ============================================

/**
 * Field-level overrides for existing content properties
 * Only specified fields will be overridden; others remain unchanged
 */
export interface FieldOverrides {
  title?: string;
  content?: string;
  order?: number;
  isActive?: boolean;
  estimatedTime?: number;    // For lessons
  contentType?: string;      // For steps/cards
}

/**
 * Extra card to inject into a lesson
 * Used to add student-specific content without modifying global lessons
 */
export interface ExtraCard {
  id: string;                // Client-generated unique ID (e.g., UUID)
  title?: string;            // Optional title for the extra card
  content: string;           // Card content (can be JSON or HTML)
  contentType: string;       // text, image, video, quiz, simulation, code
  insertAfterOrder: number;  // Insert after this order value in the lesson
}

/**
 * Complete override data structure stored as JSON in ContentOverride.overrideData
 */
export interface OverrideData {
  fieldOverrides?: FieldOverrides;
  extraCards?: ExtraCard[];      // Only valid for entityType: LESSON
  hiddenCardIds?: string[];      // Only valid for entityType: LESSON
}

// ============================================
// Service Input/Output Types
// ============================================

export interface CreateOverrideInput {
  studentId: string;
  entityType: OverrideEntityType;
  entityId: string;
  overrideData: OverrideData;
}

export interface UpdateOverrideInput {
  overrideData?: OverrideData;
  isActive?: boolean;
}

export interface GetOverridesOptions {
  entityType?: OverrideEntityType;
  includeInactive?: boolean;
}

// ============================================
// Resolved Content Types
// ============================================

export interface ResolvedStep {
  id: string;
  lessonId: string;
  title?: string | null;
  content: string;
  contentType: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string | null;
  lastModifiedAt?: Date | null;
  _isHiddenOverride?: boolean;
  _isExtraCard?: boolean;
  _hasFieldOverrides?: boolean;
}

export interface ResolvedStepsResult {
  steps: ResolvedStep[];
  hiddenStepIds: string[];
  hasOverrides: boolean;
}

export interface ResolvedLessonResult {
  lesson: any;
  hasOverrides: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface ContentOverrideResponse {
  id: string;
  studentId: string;
  entityType: OverrideEntityType;
  entityId: string;
  overrideData: OverrideData;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  student?: {
    id: string;
    name: string | null;
    email: string;
  };
  creator?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface OverridesListResponse {
  studentId: string;
  count: number;
  overrides: ContentOverrideResponse[];
}
