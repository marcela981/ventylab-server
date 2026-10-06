/*
 * Funcionalidad: Gateway RealtimeGateway
 * Descripción: Gateway de Socket.io que autentica por JWT en el handshake o con el evento authenticate, une a las salas de usuario y rol, e implementa IRealtimePublisher
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { type Server, type Socket } from "socket.io";

import {
  ACCESS_TOKEN_VERIFIER_TOKEN,
  type AccessTokenClaims,
  type IAccessTokenVerifier,
} from "@/common/application/ports/access-token-verifier.interface";
import {
  groupRoom,
  type IRealtimePublisher,
  roleRoom,
  userRoom,
} from "@/common/application/ports/realtime-publisher.interface";

export const AUTHENTICATE_EVENT: string = "authenticate";
export const AUTHENTICATED_EVENT: string = "authenticated";
export const AUTH_ERROR_EVENT: string = "auth_error";

const INVALID_TOKEN_MESSAGE: string = "Invalid token";

interface RealtimeSocketData {
  userId?: string;
}

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, IRealtimePublisher {
  private readonly _logger: Logger = new Logger(RealtimeGateway.name);
  private readonly _connectedUsers: Map<string, Set<string>> = new Map<string, Set<string>>();
  private _server: Server | undefined;

  public constructor(
    @Inject(ACCESS_TOKEN_VERIFIER_TOKEN)
    private readonly _accessTokenVerifier: IAccessTokenVerifier,
  ) {}

  public afterInit(server: Server): void {
    this._server = server;
  }

  public async handleConnection(client: Socket): Promise<void> {
    const token: string | undefined = RealtimeGateway._extractHandshakeToken(client);

    if (token === undefined) {
      return;
    }

    await this._authenticate(client, token);
  }

  public handleDisconnect(client: Socket): void {
    const data: RealtimeSocketData = client.data as RealtimeSocketData;

    if (data.userId !== undefined) {
      this._untrack(data.userId, client.id);
    }
  }

  @SubscribeMessage(AUTHENTICATE_EVENT)
  public async handleAuthenticate(@ConnectedSocket() client: Socket, @MessageBody() body: unknown): Promise<void> {
    await this._authenticate(client, RealtimeGateway._readTokenFromMessage(body));
  }

  public emitToUser(userId: string, event: string, payload: unknown): void {
    this.emitToRoom(userRoom(userId), event, payload);
  }

  public emitToGroup(groupId: string, event: string, payload: unknown): void {
    this.emitToRoom(groupRoom(groupId), event, payload);
  }

  public emitToRole(role: string, event: string, payload: unknown): void {
    this.emitToRoom(roleRoom(role), event, payload);
  }

  public emitToRoom(room: string, event: string, payload: unknown): void {
    this._server?.to(room).emit(event, payload);
  }

  public broadcast(event: string, payload: unknown): void {
    this._server?.emit(event, payload);
  }

  public joinRoom(userId: string, room: string): void {
    this._server?.in(userRoom(userId)).socketsJoin(room);
  }

  public leaveRoom(userId: string, room: string): void {
    this._server?.in(userRoom(userId)).socketsLeave(room);
  }

  public isUserConnected(userId: string): boolean {
    return this._connectedUsers.has(userId);
  }

  public getConnectedUserIds(): string[] {
    return Array.from(this._connectedUsers.keys());
  }

  private async _authenticate(client: Socket, token: string): Promise<void> {
    const claims: AccessTokenClaims | undefined = token.length > 0
      ? await this._accessTokenVerifier.verify(token)
      : undefined;

    if (!claims) {
      client.emit(AUTH_ERROR_EVENT, { message: INVALID_TOKEN_MESSAGE });
      client.disconnect(true);

      return;
    }

    const data: RealtimeSocketData = client.data as RealtimeSocketData;

    if (data.userId !== undefined && data.userId !== claims.sub) {
      this._untrack(data.userId, client.id);
    }

    data.userId = claims.sub;

    await client.join([userRoom(claims.sub), roleRoom(claims.role)]);

    this._track(claims.sub, client.id);

    this._logger.debug(`Socket ${client.id} authenticated as user ${claims.sub}`);

    client.emit(AUTHENTICATED_EVENT, { userId: claims.sub });
  }

  private _track(userId: string, socketId: string): void {
    const sockets: Set<string> = this._connectedUsers.get(userId) ?? new Set<string>();

    sockets.add(socketId);

    this._connectedUsers.set(userId, sockets);
  }

  private _untrack(userId: string, socketId: string): void {
    const sockets: Set<string> | undefined = this._connectedUsers.get(userId);

    if (!sockets) {
      return;
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      this._connectedUsers.delete(userId);
    }
  }

  private static _extractHandshakeToken(client: Socket): string | undefined {
    const auth: Record<string, unknown> = client.handshake.auth ?? {};

    if (typeof auth.token === "string" && auth.token.trim().length > 0) {
      return RealtimeGateway._stripBearer(auth.token);
    }

    const authorization: string | undefined = client.handshake.headers.authorization;

    if (authorization === undefined) {
      return undefined;
    }

    const [type, value] = authorization.split(" ");

    return type === "Bearer" && value ? value : undefined;
  }

  private static _readTokenFromMessage(body: unknown): string {
    if (typeof body === "string") {
      return RealtimeGateway._stripBearer(body);
    }

    if (typeof body === "object" && body !== null && typeof (body as { token?: unknown }).token === "string") {
      return RealtimeGateway._stripBearer((body as { token: string }).token);
    }

    return "";
  }

  private static _stripBearer(token: string): string {
    const trimmed: string = token.trim();

    return trimmed.startsWith("Bearer ") ? trimmed.slice("Bearer ".length).trim() : trimmed;
  }
}
