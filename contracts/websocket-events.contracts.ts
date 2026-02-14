/**
 * VENTYLAB - WEBSOCKET EVENTS CONTRACTS
 * Backend contracts for real-time WebSocket communication
 */

import {
  VentilatorCommand,
  VentilatorReading,
  VentilatorAlarm,
  VentilatorStatus,
} from './simulation.contracts';

// ============================================================================
// CLIENT TO SERVER EVENTS
// ============================================================================

/**
 * Events sent from client to server
 */
export interface ClientToServerEvents {
  /**
   * Send command to ventilator
   */
  'ventilator:command': (data: {
    command: VentilatorCommand;
    userId: string;
    sessionId?: string;
  }) => void;
  
  /**
   * Reserve physical ventilator
   */
  'ventilator:reserve': (data: {
    userId: string;
    durationMinutes: number;
  }) => void;
  
  /**
   * Release ventilator reservation
   */
  'ventilator:release': (data: {
    userId: string;
  }) => void;
  
  /**
   * Request current ventilator status
   */
  'ventilator:status:request': () => void;
  
  /**
   * Join simulator room (for receiving real-time data)
   */
  'simulator:join': (data: {
    userId: string;
  }) => void;
  
  /**
   * Leave simulator room
   */
  'simulator:leave': (data: {
    userId: string;
  }) => void;
  
  /**
   * Ping to check connection
   */
  'ping': () => void;
  
  /**
   * Subscribe to specific data streams
   */
  'subscribe:data': (data: {
    userId: string;
    streams: ('pressure' | 'flow' | 'volume' | 'alarms')[];
  }) => void;
  
  /**
   * Unsubscribe from data streams
   */
  'unsubscribe:data': (data: {
    userId: string;
    streams: ('pressure' | 'flow' | 'volume' | 'alarms')[];
  }) => void;
}

// ============================================================================
// SERVER TO CLIENT EVENTS
// ============================================================================

/**
 * Events sent from server to client
 */
export interface ServerToClientEvents {
  /**
   * Real-time ventilator data
   */
  'ventilator:data': (data: VentilatorReading) => void;
  
  /**
   * Ventilator alarm triggered
   */
  'ventilator:alarm': (data: VentilatorAlarm) => void;
  
  /**
   * Ventilator status update
   */
  'ventilator:status': (data: {
    status: VentilatorStatus;
    deviceId: string;
    isReserved: boolean;
    currentUser?: string;
    reservationEndsAt?: number;
  }) => void;
  
  /**
   * Error occurred
   */
  'ventilator:error': (data: {
    code: string;
    message: string;
    timestamp: number;
  }) => void;
  
  /**
   * Command acknowledgment
   */
  'ventilator:command:ack': (data: {
    commandId: string;
    success: boolean;
    message: string;
    timestamp: number;
  }) => void;
  
  /**
   * Reservation response
   */
  'ventilator:reserve:response': (data: {
    success: boolean;
    reservationId?: string;
    startTime?: number;
    endTime?: number;
    message: string;
  }) => void;
  
  /**
   * Connection established
   */
  'connected': (data: {
    userId: string;
    timestamp: number;
  }) => void;
  
  /**
   * Disconnection notice
   */
  'disconnected': (data: {
    reason: string;
    timestamp: number;
  }) => void;
  
  /**
   * Pong response to ping
   */
  'pong': () => void;
  
  /**
   * Subscription confirmation
   */
  'subscribe:confirmed': (data: {
    streams: string[];
  }) => void;
  
  /**
   * User joined room (for collaborative features)
   */
  'user:joined': (data: {
    userId: string;
    userName: string;
    timestamp: number;
  }) => void;
  
  /**
   * User left room
   */
  'user:left': (data: {
    userId: string;
    userName: string;
    timestamp: number;
  }) => void;
  
  /**
   * System notification
   */
  'notification': (data: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: number;
  }) => void;
}

// ============================================================================
// INTER-SERVER EVENTS (for scaling)
// ============================================================================

/**
 * Events for inter-server communication (Redis pub/sub)
 */
export interface InterServerEvents {
  /**
   * Broadcast data to all servers
   */
  'broadcast:data': (data: VentilatorReading) => void;
  
  /**
   * Broadcast alarm to all servers
   */
  'broadcast:alarm': (data: VentilatorAlarm) => void;
  
  /**
   * Broadcast status update
   */
  'broadcast:status': (data: any) => void;
}

// ============================================================================
// SOCKET DATA (metadata attached to each socket)
// ============================================================================

/**
 * Data attached to each socket connection
 */
export interface SocketData {
  /** User ID */
  userId: string;
  
  /** User name */
  userName: string;
  
  /** User role */
  userRole: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** Connected timestamp */
  connectedAt: number;
  
  /** Last activity timestamp */
  lastActivityAt: number;
  
  /** Subscribed streams */
  subscribedStreams: string[];
  
  /** Is monitoring ventilator */
  isMonitoring: boolean;
  
  /** Has active reservation */
  hasReservation: boolean;
}

// ============================================================================
// WEBSOCKET EVENT MAP
// ============================================================================

/**
 * Complete WebSocket event map
 * Used for type-safe Socket.io setup
 */
export interface WebSocketEventMap {
  /** Client to server events */
  clientToServer: ClientToServerEvents;
  
  /** Server to client events */
  serverToClient: ServerToClientEvents;
  
  /** Inter-server events */
  interServer: InterServerEvents;
  
  /** Socket data */
  socketData: SocketData;
}

// ============================================================================
// ROOM NAMES
// ============================================================================

/**
 * WebSocket room names for organizing connections
 */
export const SOCKET_ROOMS = {
  /** All connected users */
  ALL_USERS: 'all-users',
  
  /** Simulator users (receiving real-time data) */
  SIMULATOR: 'simulator',
  
  /** Specific user room */
  USER: (userId: string) => `user:${userId}`,
  
  /** Group room */
  GROUP: (groupId: string) => `group:${groupId}`,
  
  /** Module room (for collaborative features) */
  MODULE: (moduleId: string) => `module:${moduleId}`,
  
  /** Lesson room */
  LESSON: (lessonId: string) => `lesson:${lessonId}`,
  
  /** Teachers only */
  TEACHERS: 'teachers',
  
  /** Admins only */
  ADMINS: 'admins',
} as const;

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * WebSocket error codes
 */
export enum WebSocketErrorCode {
  /** Unauthorized connection */
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  /** Invalid data format */
  INVALID_DATA = 'INVALID_DATA',
  
  /** Ventilator not available */
  VENTILATOR_UNAVAILABLE = 'VENTILATOR_UNAVAILABLE',
  
  /** Reservation conflict */
  RESERVATION_CONFLICT = 'RESERVATION_CONFLICT',
  
  /** Rate limit exceeded */
  RATE_LIMIT = 'RATE_LIMIT',
  
  /** Internal server error */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  /** Connection timeout */
  TIMEOUT = 'TIMEOUT',
  
  /** Invalid command */
  INVALID_COMMAND = 'INVALID_COMMAND',
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * WebSocket error response
 */
export interface WebSocketError {
  /** Error code */
  code: WebSocketErrorCode;
  
  /** Error message */
  message: string;
  
  /** Additional details */
  details?: any;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * WebSocket acknowledgment
 */
export interface WebSocketAck {
  /** Whether operation was successful */
  success: boolean;
  
  /** Message */
  message: string;
  
  /** Data (if any) */
  data?: any;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Connection info
 */
export interface ConnectionInfo {
  /** Socket ID */
  socketId: string;
  
  /** User ID */
  userId: string;
  
  /** Connected timestamp */
  connectedAt: number;
  
  /** IP address */
  ipAddress?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Joined rooms */
  rooms: string[];
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * WebSocket validation constants
 */
export const WEBSOCKET_VALIDATION = {
  /** Max command rate (commands per minute) */
  MAX_COMMAND_RATE: 60,
  
  /** Max data buffer size (number of readings) */
  MAX_DATA_BUFFER: 1000,
  
  /** Ping interval (milliseconds) */
  PING_INTERVAL: 25000,
  
  /** Pong timeout (milliseconds) */
  PONG_TIMEOUT: 5000,
  
  /** Connection timeout (milliseconds) */
  CONNECTION_TIMEOUT: 60000,
  
  /** Max reconnection attempts */
  MAX_RECONNECTION_ATTEMPTS: 5,
  
  /** Reconnection delay (milliseconds) */
  RECONNECTION_DELAY: 1000,
} as const;
