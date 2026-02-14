/**
 * Simulation Types
 */

export interface VentilatorReading {
  timestamp: number;
  pressure: number;
  flow: number;
  volume: number;
  pip: number;
  peep: number;
  respiratoryRate: number;
  tidalVolume: number;
  fio2: number;
}

export interface SimulationCommand {
  type: 'SET_PARAMETER' | 'START' | 'STOP' | 'RESET';
  parameter?: string;
  value?: number;
}

export interface SimulationSession {
  id: string;
  userId: string;
  deviceId: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
}
