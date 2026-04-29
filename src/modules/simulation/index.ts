/**
 * Simulation Module – Barrel Exports
 *
 * Import order intentional: contracts → infra → service → controller
 */

// Controller factory (receives SimulationService + PatientSimulationService, returns Router)
export { createSimulationController } from './simulation.controller';

// Main orchestrator (physical ventilator via MQTT)
export { SimulationService } from './simulation.service';

// Patient simulation (signal generation from patient model)
export { PatientSimulationService } from './patient-simulation.service';

// Patient sub-services (needed for wiring in src/index.ts)
export { PatientCalculatorService } from './patient/patient-calculator.service';
export { SignalGeneratorService } from './patient/signal-generator.service';
export { ClinicalCasesService } from './patient/clinical-cases.service';

// Infrastructure adapters
export { WSGateway } from './ws-gateway';
export { MqttClient } from './mqtt-client';
export type { MqttClientOptions, TelemetryPayload } from './mqtt-client';
export { HexParser } from './hex-parser';
export { HexEncoder } from './hex-encoder';
export { InfluxTelemetryService } from './influx-service';

// Health monitor (in-memory snapshot of MQTT + WS + reservation state)
export { SimulationHealth } from './simulation.health';
export type { HealthSnapshot } from './simulation.health';

// Configuration (env-backed, used in src/index.ts and simulation module internals)
export { SIMULATION_CONFIG } from './simulation.config';

// Legacy local types (kept for backwards compat; prefer contracts/simulation.contracts.ts)
export * from './simulation.types';
