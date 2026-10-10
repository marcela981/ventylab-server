/*
 * Funcionalidad: Puerto IRealtimePublisher
 * Descripción: Define el contrato y el token del publicador de eventos en tiempo real (usuario, grupo, rol, sala, emisión volátil a varias salas, difusión, unión a salas y vaciado de sala), los nombres de sala compartidos y los eventos internos que el gateway publica al autenticarse o desconectarse un cliente y al recibir mensajes entrantes permitidos
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const REALTIME_PUBLISHER_TOKEN: unique symbol = Symbol("REALTIME_PUBLISHER_TOKEN");

export const VENTILATOR_ROOM: string = "ventilator";

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function roleRoom(role: string): string {
  return `role:${role}`;
}

export function groupRoom(groupId: string): string {
  return `group:${groupId}`;
}

export const REALTIME_CLIENT_AUTHENTICATED_EVENT: string = "realtime.client-authenticated";
export const REALTIME_CLIENT_DISCONNECTED_EVENT: string = "realtime.client-disconnected";
export const REALTIME_CLIENT_MESSAGE_EVENT: string = "realtime.client-message";

export const FORWARDED_CLIENT_EVENT_PREFIXES: readonly string[] = ["ventilator:"] as const;

export interface RealtimeClientAuthenticatedPayload {
  readonly userId: string;
  readonly role: string;
  readonly socketId: string;
}

export interface RealtimeClientDisconnectedPayload {
  readonly userId: string;
  readonly socketId: string;
  readonly remainingSockets: number;
}

export interface RealtimeClientMessagePayload {
  readonly event: string;
  readonly userId: string;
  readonly role: string;
  readonly socketId: string;
  readonly payload: unknown;
}

export interface IRealtimePublisher {
  emitToUser(userId: string, event: string, payload: unknown): void;
  emitToGroup(groupId: string, event: string, payload: unknown): void;
  emitToRole(role: string, event: string, payload: unknown): void;
  emitToRoom(room: string, event: string, payload: unknown): void;
  emitToRoomsVolatile(rooms: readonly string[], event: string, payload: unknown): void;
  broadcast(event: string, payload: unknown): void;
  joinRoom(userId: string, room: string): void;
  leaveRoom(userId: string, room: string): void;
  clearRoom(room: string): void;
  isUserConnected(userId: string): boolean;
  getConnectedUserIds(): string[];
}
