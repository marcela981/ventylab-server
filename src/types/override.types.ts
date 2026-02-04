/**
 * Content Override Types
 *
 * Type definitions for the per-student content override system.
 * These types define the structure of override data and related interfaces.
 *
 * FUTURE EXTENSIONS:
 * - Add GroupOverride types for cohort-based overrides
 * - Add TimeConstraint types for time-limited overrides
 * - Add VariantInfo types for A/B testing support
 */

import { OverrideEntityType } from '../config/constants';

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
 *
 * USAGE:
 * - fieldOverrides: Modify existing entity properties
 * - extraCards: Add new cards to a lesson (only for LESSON entityType)
 * - hiddenCardIds: Hide specific cards from student (only for LESSON entityType)
 */
export interface OverrideData {
  fieldOverrides?: FieldOverrides;
  extraCards?: ExtraCard[];      // Only valid for entityType: LESSON
  hiddenCardIds?: string[];      // Only valid for entityType: LESSON
}

// ============================================
// Service Input/Output Types
// ============================================

/**
 * Input for creating a new content override
 */
export interface CreateOverrideInput {
  studentId: string;
  entityType: OverrideEntityType;
  entityId: string;
  overrideData: OverrideData;
}

/**
 * Input for updating an existing override
 */
export interface UpdateOverrideInput {
  overrideData?: OverrideData;
  isActive?: boolean;
}

/**
 * Options for querying overrides
 */
export interface GetOverridesOptions {
  entityType?: OverrideEntityType;
  includeInactive?: boolean;
}

// ============================================
// Resolved Content Types
// ============================================

/**
 * A step/card with override markers applied
 * Used to track which content has been customized
 */
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
  // Override markers
  _isHiddenOverride?: boolean;  // True if this card should be hidden for the student
  _isExtraCard?: boolean;       // True if this is an injected extra card
  _hasFieldOverrides?: boolean; // True if field values have been overridden
}

/**
 * Result of resolving steps with overrides
 */
export interface ResolvedStepsResult {
  steps: ResolvedStep[];
  hiddenStepIds: string[];
  hasOverrides: boolean;
}

/**
 * Result of resolving a lesson with overrides
 */
export interface ResolvedLessonResult {
  lesson: any; // Prisma Lesson type with optional modifications
  hasOverrides: boolean;
}

// ============================================
// API Response Types
// ============================================

/**
 * Override response with related user information
 */
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

/**
 * Response for listing overrides
 */
export interface OverridesListResponse {
  studentId: string;
  count: number;
  overrides: ContentOverrideResponse[];
}
