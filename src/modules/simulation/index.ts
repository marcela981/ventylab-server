/**
 * Simulation Module – Barrel Exports
 *
 * Import order intentional: contracts → infra → service → controller
 */

// Controller factory (receives SimulationService, returns Router)
export { createSimulationController } from './simulation.controller';

// Main orchestrator
export { SimulationService } from './simulation.service';

// Infrastructure adapters
export { WSGateway } from './ws-gateway';
export { MqttClient } from './mqtt-client';
export type { MqttClientOptions } from './mqtt-client';
export { HexParser } from './hex-parser';
export { HexEncoder } from './hex-encoder';

// Legacy local types (kept for backwards compat; prefer contracts/simulation.contracts.ts)
export * from './simulation.types';
