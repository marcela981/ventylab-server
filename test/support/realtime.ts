/*
 * Funcionalidad: Cliente Socket.io de pruebas e2e
 * Descripción: Conecta un cliente socket.io-client real a la aplicación e2e, lo autentica con un token de acceso (mensaje authenticate y respuesta authenticated) y registra todos los eventos recibidos para que las pruebas esperen uno con un predicado
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { io, type Socket } from "socket.io-client";

const SOCKET_TIMEOUT_MS: number = 15_000;

export interface ReceivedEvent {
  readonly event: string;
  readonly payload: unknown;
}

export interface RecordingSocket {
  readonly socket: Socket;
  readonly received: ReceivedEvent[];
  next<T>(event: string, accept?: (payload: T) => boolean, timeoutMs?: number): Promise<T>;
  close(): void;
}

function onceConnected(socket: Socket): Promise<void> {
  return new Promise<void>((resolve: () => void, reject: (reason: Error) => void): void => {
    const timer: NodeJS.Timeout = setTimeout(() => reject(new Error("Timed out connecting the socket client")), SOCKET_TIMEOUT_MS);

    socket.once("connect", (): void => {
      clearTimeout(timer);
      resolve();
    });
  });
}

export async function connectRecordingSocket(baseUrl: string, token: string): Promise<RecordingSocket> {
  const socket: Socket = io(baseUrl, { transports: ["websocket"], reconnection: false, forceNew: true });
  const received: ReceivedEvent[] = [];

  socket.onAny((event: string, payload: unknown): void => {
    received.push({ event, payload });
  });

  await onceConnected(socket);

  const recorder: RecordingSocket = {
    socket,
    received,
    next: <T>(event: string, accept: (payload: T) => boolean = (): boolean => true, timeoutMs: number = SOCKET_TIMEOUT_MS): Promise<T> =>
      new Promise<T>((resolve: (value: T) => void, reject: (reason: Error) => void): void => {
        const matches = (candidate: ReceivedEvent): boolean => candidate.event === event && accept(candidate.payload as T);
        const already: ReceivedEvent | undefined = received.find(matches);

        if (already) {
          resolve(already.payload as T);

          return;
        }

        const timer: NodeJS.Timeout = setTimeout(() => {
          socket.offAny(listener);
          reject(new Error(`Timed out waiting for socket event ${event}; received: ${received.map((item: ReceivedEvent): string => item.event).join(", ")}`));
        }, timeoutMs);
        const listener = (name: string, payload: unknown): void => {
          if (matches({ event: name, payload })) {
            clearTimeout(timer);
            socket.offAny(listener);
            resolve(payload as T);
          }
        };

        socket.onAny(listener);
      }),
    close: (): void => {
      socket.disconnect();
    },
  };

  const authenticated: Promise<{ userId: string }> = recorder.next<{ userId: string }>("authenticated");

  socket.emit("authenticate", { token });
  await authenticated;

  return recorder;
}
