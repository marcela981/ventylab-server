/*
 * Funcionalidad: Puerto IVentilatorDeviceGateway
 * Descripción: Contrato de la conexión con el ventilador físico (Node-RED/ESP): conectar y desconectar, publicar comandos, suscribirse a los flujos de telemetría y alarmas, y consultar el estado y los datos de conexión
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";
import { type VentilatorStatusValue } from "@/features/simulation/domain/value-objects/ventilator-telemetry";

export const VENTILATOR_DEVICE_GATEWAY_TOKEN: unique symbol = Symbol("VENTILATOR_DEVICE_GATEWAY_TOKEN");

export type DevicePayloadListener = (payload: Buffer) => void;

export interface DeviceConnectionInfo {
  brokerUrl: string;
  telemetryTopic: string;
}

export interface IVentilatorDeviceGateway {
  readonly connectionInfo: DeviceConnectionInfo;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publishCommand(command: VentilatorCommand): Promise<void>;
  onTelemetry(listener: DevicePayloadListener): void;
  onAlarm(listener: DevicePayloadListener): void;
  getStatus(): VentilatorStatusValue;
  isConnected(): boolean;
}
