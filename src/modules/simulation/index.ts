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
export type { MqttClientOptions } from './mqtt-client';
export { HexParser } from './hex-parser';
export { HexEncoder } from './hex-encoder';

// Legacy local types (kept for backwards compat; prefer contracts/simulation.contracts.ts)
export * from './simulation.types';
