/**
 * @module WSGateway
 * @description Gateway WebSocket para comunicación en tiempo real con el frontend.
 * Implementa ISimulationGateway usando Socket.io.
 *
 * Flujo de autenticación:
 *   client connects  →  server registers socket
 *   client emits 'authenticate' with JWT token
 *     valid   → server maps userId → socket, emits 'authenticated'
 *     invalid → server emits 'auth_error', disconnects socket
 *   client disconnects → server removes userId from map
 *
 * Broadcasting:
 *   broadcastData(event, data)      → io.emit  (all clients)
 *   sendToUser(userId, event, data) → socket.emit  (one authenticated client)
 */

import type { Server as SocketServer, Socket } from 'socket.io';
import type { ISimulationGateway } from '../../../contracts/simulation.contracts';
import { verifyToken } from '../../shared/utils/jwt';

export class WSGateway implements ISimulationGateway {
  private readonly io: SocketServer;
  /** Maps authenticated userId → socket instance. */
  private readonly connectedUsers = new Map<string, Socket>();

  constructor(io: SocketServer) {
    this.io = io;
    this.setupConnectionHandlers();
  }

  // ---------------------------------------------------------------------------
  // ISimulationGateway implementation
  // ---------------------------------------------------------------------------

  /**
   * Emite un evento a TODOS los clientes conectados.
   */
  broadcastData(event: string, data: unknown): void {
    this.io.emit(event, data);
  }

  /**
   * Emite un evento al socket de un usuario autenticado específico.
   * No-op silencioso si el usuario no está conectado.
   */
  sendToUser(userId: string, event: string, data: unknown): void {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * Retorna los userIds de todos los usuarios actualmente autenticados.
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Indica si un usuario tiene una sesión WebSocket autenticada activa.
   */
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WSGateway] Socket connected: ${socket.id}`);

      socket.on('authenticate', (token: string) => {
        try {
          const decoded = verifyToken(token);
          const userId = decoded.id;

          this.connectedUsers.set(userId, socket);
          socket.emit('authenticated', { userId });
          console.log(`[WSGateway] User authenticated: ${userId} (socket ${socket.id})`);

          socket.on('disconnect', () => {
            this.connectedUsers.delete(userId);
            console.log(`[WSGateway] User disconnected: ${userId}`);
          });
        } catch {
          socket.emit('auth_error', { message: 'Invalid token' });
          socket.disconnect();
        }
      });
    });
  }
}
