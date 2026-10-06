/*
 * Funcionalidad: Puerto IRealtimePublisher
 * Descripción: Define el contrato y el token del publicador de eventos en tiempo real (usuario, grupo, rol, sala, difusión, unión a salas) y los nombres de sala compartidos
 * Versión: 1.0
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

export interface IRealtimePublisher {
  emitToUser(userId: string, event: string, payload: unknown): void;
  emitToGroup(groupId: string, event: string, payload: unknown): void;
  emitToRole(role: string, event: string, payload: unknown): void;
  emitToRoom(room: string, event: string, payload: unknown): void;
  broadcast(event: string, payload: unknown): void;
  joinRoom(userId: string, room: string): void;
  leaveRoom(userId: string, room: string): void;
  isUserConnected(userId: string): boolean;
  getConnectedUserIds(): string[];
}
