/*
 * Funcionalidad: Pruebas del gateway en tiempo real
 * Descripción: Verifica que el gateway publique los eventos internos de cliente autenticado y desconectado, reenvíe solo los mensajes entrantes permitidos (prefijo ventilator:) de sockets autenticados, emita en modo volátil a varias salas a la vez y vacíe salas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type Server, type Socket } from "socket.io";

import { type AccessTokenClaims, type IAccessTokenVerifier } from "@/common/application/ports/access-token-verifier.interface";
import { RealtimeGateway } from "@/common/infrastructure/realtime/realtime.gateway";

type AnyListener = (event: string, payload: unknown) => void;

interface FakeSocket {
  readonly socket: Socket;
  readonly fireAny: AnyListener;
}

function fakeSocket(id: string, token: string | undefined): FakeSocket {
  let anyListener: AnyListener = (): void => undefined;

  const socket: Socket = {
    id,
    data: {},
    handshake: { auth: token === undefined ? {} : { token }, headers: {} },
    onAny: (listener: AnyListener): void => {
      anyListener = listener;
    },
    join: jest.fn(async (): Promise<void> => await Promise.resolve()),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket;

  return { socket, fireAny: (event: string, payload: unknown): void => anyListener(event, payload) };
}

function buildGateway(): { gateway: RealtimeGateway; emit: jest.Mock } {
  const claims: AccessTokenClaims = { sub: "user-1", role: "STUDENT" };
  const verifier: IAccessTokenVerifier = {
    verify: async (token: string): Promise<AccessTokenClaims | undefined> => await Promise.resolve(token === "valid" ? claims : undefined),
  };
  const emit: jest.Mock = jest.fn();

  return { gateway: new RealtimeGateway(verifier, { emit } as unknown as EventEmitter2), emit };
}

describe("RealtimeGateway", () => {
  it("publishes client-authenticated and client-disconnected internal events", async () => {
    const { gateway, emit }: { gateway: RealtimeGateway; emit: jest.Mock } = buildGateway();
    const { socket }: FakeSocket = fakeSocket("socket-1", "valid");

    await gateway.handleConnection(socket);
    gateway.handleDisconnect(socket);

    expect(emit.mock.calls).toEqual([
      ["realtime.client-authenticated", { userId: "user-1", role: "STUDENT", socketId: "socket-1" }],
      ["realtime.client-disconnected", { userId: "user-1", socketId: "socket-1", remainingSockets: 0 }],
    ]);
  });

  it("forwards only ventilator: messages from authenticated sockets", async () => {
    const { gateway, emit }: { gateway: RealtimeGateway; emit: jest.Mock } = buildGateway();
    const anonymous: FakeSocket = fakeSocket("socket-0", undefined);
    const authenticated: FakeSocket = fakeSocket("socket-1", "valid");

    await gateway.handleConnection(anonymous.socket);
    await gateway.handleConnection(authenticated.socket);
    emit.mockClear();

    anonymous.fireAny("ventilator:join", {});
    authenticated.fireAny("chat:message", {});
    authenticated.fireAny("ventilator:join", { reason: "watch" });

    expect(emit.mock.calls).toEqual([
      ["realtime.client-message", { event: "ventilator:join", userId: "user-1", role: "STUDENT", socketId: "socket-1", payload: { reason: "watch" } }],
    ]);
  });

  it("emits volatile events to several rooms at once and clears rooms", () => {
    const { gateway }: { gateway: RealtimeGateway } = buildGateway();
    const volatileEmit: jest.Mock = jest.fn();
    const socketsLeave: jest.Mock = jest.fn();
    const to: jest.Mock = jest.fn(() => ({ volatile: { emit: volatileEmit } }));
    const inRoom: jest.Mock = jest.fn(() => ({ socketsLeave }));

    gateway.afterInit({ to, in: inRoom } as unknown as Server);
    gateway.emitToRoomsVolatile(["ventilator", "role:TEACHER"], "ventilator:telemetry", { frames: [] });
    gateway.clearRoom("ventilator");

    expect(to).toHaveBeenCalledWith(["ventilator", "role:TEACHER"]);
    expect(volatileEmit).toHaveBeenCalledWith("ventilator:telemetry", { frames: [] });
    expect(inRoom).toHaveBeenCalledWith("ventilator");
    expect(socketsLeave).toHaveBeenCalledWith("ventilator");
  });
});
