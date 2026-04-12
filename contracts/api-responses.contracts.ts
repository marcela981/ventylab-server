/**
 * VENTYLAB - API RESPONSES CONTRACTS
 * Backend contracts for standardized API responses
 */

// ============================================================================
// STANDARD RESPONSE TYPES
// ============================================================================

/**
 * Standard success response
 */
export interface SuccessResponse<T = any> {
  /** Success flag */
  success: true;
  
  /** Response data */
  data: T;
  
  /** Success message */
  message: string;
  
  /** Server timestamp */
  timestamp: number;
  
  /** Request ID (for tracking) */
  requestId?: string;
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  /** Success flag (always false) */
  success: false;
  
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Detailed error information */
  details?: any;
  
  /** Field-specific errors (for validation) */
  errors?: FieldError[];
  
  /** Server timestamp */
  timestamp: number;
  
  /** Request ID (for tracking) */
  requestId?: string;
  
  /** Stack trace (only in development) */
  stack?: string;
}

/**
 * Field-specific validation error
 */
export interface FieldError {
  /** Field name */
  field: string;
  
  /** Error message */
  message: string;
  
  /** Error code */
  code?: string;
  
  /** Current value */
  value?: any;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T = any> {
  /** Success flag */
  success: true;
  
  /** Array of items */
  data: T[];
  
  /** Pagination metadata */
  pagination: {
    /** Current page number */
    page: number;
    
    /** Number of items per page */
    limit: number;
    
    /** Total number of items */
    total: number;
    
    /** Total number of pages */
    totalPages: number;
    
    /** Whether there is a next page */
    hasNext: boolean;
    
    /** Whether there is a previous page */
    hasPrev: boolean;
  };
  
  /** Message */
  message: string;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * API response (union of success and error)
 */
export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

/**
 * HTTP status codes used in the API
 */
export enum HTTPStatus {
  // Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Application-specific error codes
 */
export enum ErrorCode {
  // Validation Errors (1xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  
  // Authentication Errors (2xxx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Authorization Errors (3xxx)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Resource Errors (4xxx)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business Logic Errors (5xxx)
  PREREQUISITE_NOT_MET = 'PREREQUISITE_NOT_MET',
  MAX_ATTEMPTS_EXCEEDED = 'MAX_ATTEMPTS_EXCEEDED',
  RESERVATION_CONFLICT = 'RESERVATION_CONFLICT',
  VENTILATOR_UNAVAILABLE = 'VENTILATOR_UNAVAILABLE',
  
  // Rate Limiting (6xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // External Service Errors (7xxx)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  MQTT_ERROR = 'MQTT_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  
  // Internal Errors (8xxx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  
  // Unknown (9xxx)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

/**
 * Success response builder interface
 */
export interface IResponseBuilder {
  /**
   * Build success response
   */
  success<T>(data: T, message?: string): SuccessResponse<T>;
  
  /**
   * Build created response
   */
  created<T>(data: T, message?: string): SuccessResponse<T>;
  
  /**
   * Build error response
   */
  error(code: ErrorCode, message: string, details?: any): ErrorResponse;
  
  /**
   * Build validation error response
   */
  validationError(errors: FieldError[], message?: string): ErrorResponse;
  
  /**
   * Build not found error response
   */
  notFound(resource: string, id?: string): ErrorResponse;
  
  /**
   * Build unauthorized error response
   */
  unauthorized(message?: string): ErrorResponse;
  
  /**
   * Build forbidden error response
   */
  forbidden(message?: string): ErrorResponse;
  
  /**
   * Build conflict error response
   */
  conflict(message: string, details?: any): ErrorResponse;
  
  /**
   * Build paginated response
   */
  paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): PaginatedResponse<T>;
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /** Service status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  
  /** Service version */
  version: string;
  
  /** Uptime in seconds */
  uptime: number;
  
  /** Timestamp */
  timestamp: number;
  
  /** Component health */
  components: {
    database: ComponentHealth;
    mqtt: ComponentHealth;
    websocket: ComponentHealth;
    ai: ComponentHealth;
  };
}

/**
 * Component health status
 */
export interface ComponentHealth {
  /** Status */
  status: 'healthy' | 'unhealthy' | 'degraded';
  
  /** Response time in milliseconds */
  responseTime?: number;
  
  /** Error message if unhealthy */
  error?: string;
  
  /** Last checked timestamp */
  lastChecked: number;
}

// ============================================================================
// API VERSIONING
// ============================================================================

/**
 * API version info
 */
export interface APIVersionInfo {
  /** Current version */
  version: string;
  
  /** Supported versions */
  supportedVersions: string[];
  
  /** Deprecated versions */
  deprecatedVersions: string[];
  
  /** API base URL */
  baseUrl: string;
  
  /** Documentation URL */
  docsUrl: string;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Rate limit headers/info
 */
export interface RateLimitInfo {
  /** Limit (requests per window) */
  limit: number;
  
  /** Remaining requests */
  remaining: number;
  
  /** Reset timestamp */
  reset: number;
  
  /** Retry after (seconds, if exceeded) */
  retryAfter?: number;
}

// ============================================================================
// REQUEST METADATA
// ============================================================================

/**
 * Request metadata for logging/tracking
 */
export interface RequestMetadata {
  /** Request ID (UUID) */
  requestId: string;
  
  /** User ID (if authenticated) */
  userId?: string;
  
  /** User role */
  userRole?: string;
  
  /** IP address */
  ipAddress: string;
  
  /** User agent */
  userAgent: string;
  
  /** Request method */
  method: string;
  
  /** Request path */
  path: string;
  
  /** Request timestamp */
  timestamp: number;
  
  /** Response time (milliseconds) */
  responseTime?: number;
  
  /** Status code */
  statusCode?: number;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  
  /** Validation errors */
  errors: FieldError[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Field name */
  field: string;
  
  /** Rule type */
  type: 'required' | 'string' | 'number' | 'email' | 'url' | 'min' | 'max' | 'pattern' | 'custom';
  
  /** Rule value (for min, max, pattern) */
  value?: any;
  
  /** Error message */
  message: string;
  
  /** Custom validator function */
  validator?: (value: any) => boolean;
}

// ============================================================================
// RESPONSE CONSTANTS
// ============================================================================

/**
 * Standard response messages
 */
export const RESPONSE_MESSAGES = {
  // Success
  SUCCESS: 'Operation completed successfully',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  
  // Errors
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT: 'Too many requests',
  
  // Specific
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_SENT: 'Email sent successfully',
} as const;

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  /** Default page number */
  PAGE: 1,
  
  /** Default page size */
  LIMIT: 20,
  
  /** Minimum page size */
  MIN_LIMIT: 1,
  
  /** Maximum page size */
  MAX_LIMIT: 100,
} as const;
