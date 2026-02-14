/**
 * VENTYLAB - SIMULATION MODULE CONTRACTS
 * Backend contracts for real-time ventilator simulation
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Supported ventilation modes
 */
export enum VentilationMode {
  VCV = 'VCV',   // Volume Control Ventilation
  PCV = 'PCV',   // Pressure Control Ventilation
  SIMV = 'SIMV', // Synchronized Intermittent Mandatory Ventilation
  PSV = 'PSV',   // Pressure Support Ventilation
}

/**
 * Alarm severity levels
 */
export enum AlarmSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Alarm types
 */
export enum AlarmType {
  HIGH_PRESSURE = 'HIGH_PRESSURE',
  LOW_PRESSURE = 'LOW_PRESSURE',
  HIGH_VOLUME = 'HIGH_VOLUME',
  LOW_VOLUME = 'LOW_VOLUME',
  APNEA = 'APNEA',
  DISCONNECTION = 'DISCONNECTION',
  POWER_FAILURE = 'POWER_FAILURE',
  TECHNICAL_FAULT = 'TECHNICAL_FAULT',
}

/**
 * Ventilator connection status
 */
export enum VentilatorStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  RESERVED = 'RESERVED',
}

/**
 * Hexadecimal message types
 */
export enum HexMessageType {
  PRESSURE = 0xA1,
  FLOW = 0xA2,
  VOLUME = 0xA3,
  ALARM = 0xA4,
  COMMAND = 0xB1,
  ACK = 0xB2,
}

// ============================================================================
// DOMAIN TYPES
// ============================================================================

/**
 * Ventilator command configuration
 * Represents parameters sent to physical ventilator
 */
export interface VentilatorCommand {
  /** Ventilation mode */
  mode: VentilationMode;
  
  /** Tidal volume in ml (200-800 ml) */
  tidalVolume: number;
  
  /** Respiratory rate in breaths/min (5-40 resp/min) */
  respiratoryRate: number;
  
  /** PEEP (Positive End-Expiratory Pressure) in cmH₂O (0-20 cmH₂O) */
  peep: number;
  
  /** FiO₂ (Fraction of Inspired Oxygen) 0.21-1.0 (21%-100%) */
  fio2: number;
  
  /** Pressure limit in cmH₂O (10-50 cmH₂O) */
  pressureLimit?: number;
  
  /** Inspiratory time in seconds */
  inspiratoryTime?: number;
  
  /** I:E ratio (Inspiratory:Expiratory) */
  ieRatio?: string;
  
  /** Trigger sensitivity */
  sensitivity?: number;
  
  /** Flow rate in L/min */
  flowRate?: number;
  
  /** Timestamp when command was created */
  timestamp: number;
}

/**
 * Real-time ventilator reading
 * Data received from physical ventilator at 30-60 Hz
 */
export interface VentilatorReading {
  /** Airway pressure in cmH₂O */
  pressure: number;
  
  /** Flow rate in L/min */
  flow: number;
  
  /** Volume in ml */
  volume: number;
  
  /** Partial pressure of CO₂ in mmHg (optional) */
  pco2?: number;
  
  /** SpO₂ percentage (optional) */
  spo2?: number;
  
  /** Timestamp in milliseconds */
  timestamp: number;
  
  /** Device ID */
  deviceId: string;
}

/**
 * Ventilator alarm
 */
export interface VentilatorAlarm {
  /** Alarm type */
  type: AlarmType;
  
  /** Severity level */
  severity: AlarmSeverity;
  
  /** Human-readable message */
  message: string;
  
  /** Current value that triggered alarm */
  currentValue?: number;
  
  /** Threshold value */
  thresholdValue?: number;
  
  /** Timestamp when alarm was triggered */
  timestamp: number;
  
  /** Whether alarm is active */
  active: boolean;
  
  /** Whether alarm has been acknowledged */
  acknowledged: boolean;
}

/**
 * Parsed hexadecimal pressure message
 */
export interface HexPressureData {
  type: HexMessageType.PRESSURE;
  pressure: number;
  timestamp: number;
}

/**
 * Parsed hexadecimal flow message
 */
export interface HexFlowData {
  type: HexMessageType.FLOW;
  flow: number;
  timestamp: number;
}

/**
 * Parsed hexadecimal volume message
 */
export interface HexVolumeData {
  type: HexMessageType.VOLUME;
  volume: number;
  timestamp: number;
}

/**
 * Parsed hexadecimal alarm message
 */
export interface HexAlarmData {
  type: HexMessageType.ALARM;
  alarmType: AlarmType;
  severity: AlarmSeverity;
  timestamp: number;
}

/**
 * Union type for all hex data messages
 */
export type HexData = HexPressureData | HexFlowData | HexVolumeData | HexAlarmData;

// ============================================================================
// DOMAIN INTERFACES (PORTS)
// ============================================================================

/**
 * Gateway for WebSocket communication with frontend clients
 * Abstraction layer for real-time data broadcasting
 */
export interface ISimulationGateway {
  /**
   * Broadcast data to all connected clients
   * @param event - Event name
   * @param data - Data to broadcast
   */
  broadcastData(event: string, data: any): void;
  
  /**
   * Send data to specific user
   * @param userId - Target user ID
   * @param event - Event name
   * @param data - Data to send
   */
  sendToUser(userId: string, event: string, data: any): void;
  
  /**
   * Get list of connected user IDs
   */
  getConnectedUsers(): string[];
  
  /**
   * Check if user is connected
   * @param userId - User ID to check
   */
  isUserConnected(userId: string): boolean;
}

/**
 * MQTT connection to physical ventilator via Node-RED
 * Abstraction layer for bidirectional MQTT communication
 */
export interface IVentilatorConnection {
  /**
   * Connect to MQTT broker
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void>;
  
  /**
   * Disconnect from MQTT broker
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>;
  
  /**
   * Publish command to ventilator
   * @param command - Ventilator command to send
   * @returns Promise that resolves when published
   */
  publishCommand(command: VentilatorCommand): Promise<void>;
  
  /**
   * Subscribe to telemetry topic
   * @param callback - Function to call when telemetry received
   */
  subscribeTelemetry(callback: (data: Buffer) => void): void;
  
  /**
   * Get connection status
   */
  getStatus(): VentilatorStatus;
  
  /**
   * Check if connected
   */
  isConnected(): boolean;
}

/**
 * Hexadecimal parser interface
 * Converts binary buffer to typed data objects
 */
export interface IHexParser {
  /**
   * Parse hexadecimal buffer to typed data
   * @param buffer - Raw buffer from MQTT
   * @returns Parsed data object or null if invalid
   */
  parse(buffer: Buffer): HexData | null;
  
  /**
   * Validate buffer format
   * @param buffer - Buffer to validate
   * @returns True if valid, false otherwise
   */
  validate(buffer: Buffer): boolean;
  
  /**
   * Calculate checksum
   * @param buffer - Buffer to calculate checksum for
   * @returns Checksum value
   */
  calculateChecksum(buffer: Buffer): number;
}

/**
 * Hexadecimal encoder interface
 * Converts typed command objects to binary buffer
 */
export interface IHexEncoder {
  /**
   * Encode command to hexadecimal buffer
   * @param command - Ventilator command
   * @returns Encoded buffer ready for MQTT
   */
  encode(command: VentilatorCommand): Buffer;
  
  /**
   * Validate command parameters
   * @param command - Command to validate
   * @returns True if valid, false otherwise
   */
  validateCommand(command: VentilatorCommand): boolean;
  
  /**
   * Get validation errors
   * @param command - Command to validate
   * @returns Array of error messages
   */
  getValidationErrors(command: VentilatorCommand): string[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request to send command to ventilator
 */
export interface SendCommandRequest {
  /** Command configuration */
  command: VentilatorCommand;
  
  /** Optional user ID (for tracking) */
  userId?: string;
  
  /** Optional session ID */
  sessionId?: string;
}

/**
 * Response after sending command
 */
export interface SendCommandResponse {
  /** Whether command was sent successfully */
  success: boolean;
  
  /** Human-readable message */
  message: string;
  
  /** Server timestamp */
  timestamp: number;
  
  /** Command ID for tracking */
  commandId?: string;
  
  /** Any validation errors */
  errors?: string[];
}

/**
 * Request to reserve physical ventilator
 */
export interface ReserveVentilatorRequest {
  /** User ID */
  userId: string;
  
  /** Requested duration in minutes */
  durationMinutes: number;
  
  /** Optional reason/purpose */
  purpose?: string;
}

/**
 * Response after reservation attempt
 */
export interface ReserveVentilatorResponse {
  /** Whether reservation was successful */
  success: boolean;
  
  /** Reservation ID if successful */
  reservationId?: string;
  
  /** Start time of reservation */
  startTime?: number;
  
  /** End time of reservation */
  endTime?: number;
  
  /** Current user if already reserved */
  currentUser?: string;
  
  /** Message */
  message: string;
}

/**
 * Request to get current ventilator status
 */
export interface GetVentilatorStatusRequest {
  /** Device ID (optional) */
  deviceId?: string;
}

/**
 * Response with ventilator status
 */
export interface GetVentilatorStatusResponse {
  /** Connection status */
  status: VentilatorStatus;
  
  /** Device ID */
  deviceId: string;
  
  /** Whether reserved */
  isReserved: boolean;
  
  /** Current user if reserved */
  currentUser?: string;
  
  /** Reservation end time if reserved */
  reservationEndsAt?: number;
  
  /** Last data received timestamp */
  lastDataTimestamp?: number;
  
  /** Active alarms */
  activeAlarms: VentilatorAlarm[];
}

/**
 * Request to save simulator session
 */
export interface SaveSimulatorSessionRequest {
  /** User ID */
  userId: string;
  
  /** Whether using real ventilator */
  isRealVentilator: boolean;
  
  /** Parameters used */
  parametersLog: VentilatorCommand[];
  
  /** Ventilator data collected */
  ventilatorData: VentilatorReading[];
  
  /** Optional notes */
  notes?: string;
  
  /** Optional clinical case ID */
  clinicalCaseId?: string;
}

/**
 * Response after saving session
 */
export interface SaveSimulatorSessionResponse {
  /** Whether save was successful */
  success: boolean;
  
  /** Session ID */
  sessionId: string;
  
  /** Message */
  message: string;
  
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Safe ranges for ventilator parameters
 * Used for validation before sending commands
 */
export const VENTILATOR_SAFE_RANGES = {
  /** PEEP range in cmH₂O */
  PEEP: { min: 0, max: 20, unit: 'cmH₂O' },
  
  /** FiO₂ range (21%-100%) */
  FIO2: { min: 0.21, max: 1.0, unit: 'fraction' },
  
  /** Tidal volume range in ml */
  TIDAL_VOLUME: { min: 200, max: 800, unit: 'ml' },
  
  /** Respiratory rate range in breaths/min */
  RESPIRATORY_RATE: { min: 5, max: 40, unit: 'breaths/min' },
  
  /** Pressure limit range in cmH₂O */
  PRESSURE_LIMIT: { min: 10, max: 50, unit: 'cmH₂O' },
  
  /** Inspiratory time range in seconds */
  INSPIRATORY_TIME: { min: 0.5, max: 3.0, unit: 'seconds' },
  
  /** Flow rate range in L/min */
  FLOW_RATE: { min: 20, max: 100, unit: 'L/min' },
} as const;

/**
 * MQTT topic structure
 */
export const MQTT_TOPICS = {
  /** Telemetry from ventilator to backend */
  TELEMETRY: 'ventilab/device/001/telemetry',
  
  /** Commands from backend to ventilator */
  COMMAND: 'ventilab/device/001/command',
  
  /** Status updates */
  STATUS: 'ventilab/device/001/status',
  
  /** Alarms */
  ALARM: 'ventilab/device/001/alarm',
} as const;

/**
 * Hexadecimal frame structure constants
 */
export const HEX_FRAME = {
  /** Start byte value */
  START_BYTE: 0xFF,
  
  /** Minimum frame length */
  MIN_LENGTH: 6,
  
  /** Maximum frame length */
  MAX_LENGTH: 256,
  
  /** Positions in frame */
  POSITION: {
    START: 0,
    TYPE: 1,
    LENGTH: 2,
    DATA_START: 3,
  },
} as const;
