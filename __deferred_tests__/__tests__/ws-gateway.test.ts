/**
 * @file ws-gateway.test.ts
 * @description Unit tests for WSGateway.
 *
 * Socket.io is replaced with minimal hand-rolled fakes to avoid EventEmitter
 * type conflicts and to separate concerns clearly:
 *
 *   MockSocket
 *     .on(event, handler)      → stored internally (called by WSGateway setup)
 *     .simulateEvent(event)    → dispatches to stored handlers (incoming from client)
 *     .emit                    → jest.fn() spy for outgoing messages (gateway → client)
 *     .disconnect              → jest.fn() spy
 *
 *   MockServer
 *     .on('connection', h)     → stored (WSGateway calls this in constructor)
 *     .simulateConnection()    → creates MockSocket, fires stored handlers
 *     .emit                    → jest.fn() spy (WSGateway calls io.emit for broadcast)
 *     .listenerCount()         → for assertions
 */

import { WSGateway } from '../ws-gateway';

// ============================================================================
// Mock JWT module
// ============================================================================

jest.mock('../../../shared/utils/jwt', () => ({
  verifyToken: jest.fn(),
}));

import { verifyToken } from '../../../shared/utils/jwt';
const mockVerifyToken = verifyToken as jest.Mock;

// ============================================================================
// Fake Socket.io primitives
// ============================================================================

class MockSocket {
  readonly id: string;
  /** Spy capturing outgoing emits: gateway calls socket.emit(event, data). */
  readonly emit = jest.fn<boolean, [string, ...unknown[]]>();
  readonly disconnect = jest.fn();

  private readonly _listeners = new Map<string, ((...args: unknown[]) => void)[]>();

  constructor(id: string) {
    this.id = id;
  }

  /** Called by WSGateway to register event handlers. */
  on(event: string, listener: (...args: unknown[]) => void): this {
    const bucket = this._listeners.get(event) ?? [];
    bucket.push(listener);
    this._listeners.set(event, bucket);
    return this;
  }

  /** Simulate a message arriving FROM the client → dispatches to stored handlers. */
  simulateEvent(event: string, ...args: unknown[]): void {
    (this._listeners.get(event) ?? []).forEach((l) => l(...args));
  }
}

class MockServer {
  /** Spy capturing broadcast emits: gateway calls io.emit(event, data). */
  readonly emit = jest.fn<boolean, [string, ...unknown[]]>();

  private readonly _connectionHandlers: ((socket: MockSocket) => void)[] = [];

  on(event: string, listener: (socket: MockSocket) => void): this {
    if (event === 'connection') this._connectionHandlers.push(listener);
    return this;
  }

  listenerCount(event: string): number {
    return event === 'connection' ? this._connectionHandlers.length : 0;
  }

  simulateConnection(socketId = 'socket-1'): MockSocket {
    const socket = new MockSocket(socketId);
    this._connectionHandlers.forEach((h) => h(socket));
    return socket;
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('WSGateway', () => {
  let mockServer: MockServer;
  let gateway: WSGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = new MockServer();
    gateway = new WSGateway(mockServer as any);
  });

  // --------------------------------------------------------------------------
  // Constructor / setup
  // --------------------------------------------------------------------------

  describe('constructor', () => {
    it('registers a connection handler on the server immediately', () => {
      expect(mockServer.listenerCount('connection')).toBe(1);
    });

    it('starts with no connected users', () => {
      expect(gateway.getConnectedUsers()).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // Authentication
  // --------------------------------------------------------------------------

  describe('authenticate event', () => {
    it('maps userId → socket and emits authenticated on valid token', () => {
      mockVerifyToken.mockReturnValue({ id: 'user-42', email: 'a@b.com', role: 'STUDENT' });

      const socket = mockServer.simulateConnection();
      socket.simulateEvent('authenticate', 'valid-token');

      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token');
      expect(gateway.isUserConnected('user-42')).toBe(true);
      expect(socket.emit).toHaveBeenCalledWith('authenticated', { userId: 'user-42' });
    });

    it('uses the id field from TokenPayload as the userId key', () => {
      mockVerifyToken.mockReturnValue({ id: 'the-real-id', email: 'x@y.com', role: 'TEACHER' });

      const socket = mockServer.simulateConnection();
      socket.simulateEvent('authenticate', 'token');

      expect(gateway.isUserConnected('the-real-id')).toBe(true);
    });

    it('emits auth_error and disconnects on invalid token', () => {
      mockVerifyToken.mockImplementation(() => { throw new Error('jwt expired'); });

      const socket = mockServer.simulateConnection();
      socket.simulateEvent('authenticate', 'bad-token');

      expect(socket.emit).toHaveBeenCalledWith('auth_error', { message: 'Invalid token' });
      expect(socket.disconnect).toHaveBeenCalled();
      expect(gateway.getConnectedUsers()).toHaveLength(0);
    });

    it('does not add the socket to the map when authentication fails', () => {
      mockVerifyToken.mockImplementation(() => { throw new Error('invalid'); });

      const socket = mockServer.simulateConnection();
      socket.simulateEvent('authenticate', 'bad');

      expect(gateway.isUserConnected('user-42')).toBe(false);
    });

    it('supports multiple users authenticated on separate sockets', () => {
      mockVerifyToken
        .mockReturnValueOnce({ id: 'alice', email: 'a@b.com', role: 'STUDENT' })
        .mockReturnValueOnce({ id: 'bob', email: 'b@b.com', role: 'STUDENT' });

      const s1 = mockServer.simulateConnection('s1');
      const s2 = mockServer.simulateConnection('s2');
      s1.simulateEvent('authenticate', 'tokenA');
      s2.simulateEvent('authenticate', 'tokenB');

      expect(gateway.isUserConnected('alice')).toBe(true);
      expect(gateway.isUserConnected('bob')).toBe(true);
      expect(gateway.getConnectedUsers()).toHaveLength(2);
    });
  });

  // --------------------------------------------------------------------------
  // Disconnect
  // --------------------------------------------------------------------------

  describe('disconnect event', () => {
    it('removes the user from the map on disconnect', () => {
      mockVerifyToken.mockReturnValue({ id: 'user-1', email: 'u@u.com', role: 'STUDENT' });

      const socket = mockServer.simulateConnection();
      socket.simulateEvent('authenticate', 'token');
      expect(gateway.isUserConnected('user-1')).toBe(true);

      socket.simulateEvent('disconnect');
      expect(gateway.isUserConnected('user-1')).toBe(false);
    });

    it('does not affect other users when one disconnects', () => {
      mockVerifyToken
        .mockReturnValueOnce({ id: 'alice', email: 'a@b.com', role: 'STUDENT' })
        .mockReturnValueOnce({ id: 'bob', email: 'b@b.com', role: 'STUDENT' });

      const s1 = mockServer.simulateConnection('s1');
      const s2 = mockServer.simulateConnection('s2');
      s1.simulateEvent('authenticate', 'tokenA');
      s2.simulateEvent('authenticate', 'tokenB');

      s1.simulateEvent('disconnect');

      expect(gateway.isUserConnected('alice')).toBe(false);
      expect(gateway.isUserConnected('bob')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // broadcastData()
  // --------------------------------------------------------------------------

  describe('broadcastData()', () => {
    it('calls io.emit with the event and data', () => {
      const data = { pressure: 12.5, flow: 30 };
      gateway.broadcastData('ventilator:data', data);

      expect(mockServer.emit).toHaveBeenCalledWith('ventilator:data', data);
    });

    it('works even when no users are connected', () => {
      expect(() => gateway.broadcastData('ventilator:status', 'CONNECTED')).not.toThrow();
    });

    it('forwards any event name and payload shape', () => {
      gateway.broadcastData('reservation:update', { reservationId: 'abc', endTime: 9999 });
      expect(mockServer.emit).toHaveBeenCalledWith(
        'reservation:update',
        { reservationId: 'abc', endTime: 9999 },
      );
    });
  });

  // --------------------------------------------------------------------------
  // sendToUser()
  // --------------------------------------------------------------------------

  describe('sendToUser()', () => {
    it('emits on the target user socket when the user is connected', () => {
      mockVerifyToken.mockReturnValue({ id: 'user-7', email: 'u@u.com', role: 'STUDENT' });
      const socket = mockServer.simulateConnection();
      socket.simulateEvent('authenticate', 'token');

      const alarmPayload = { type: 'HIGH_PRESSURE', severity: 'CRITICAL' };
      gateway.sendToUser('user-7', 'ventilator:alarm', alarmPayload);

      expect(socket.emit).toHaveBeenCalledWith('ventilator:alarm', alarmPayload);
    });

    it('is a no-op when the user is not connected (no throw)', () => {
      expect(() =>
        gateway.sendToUser('unknown-user', 'ventilator:data', {}),
      ).not.toThrow();
    });

    it('does not send to other users', () => {
      mockVerifyToken
        .mockReturnValueOnce({ id: 'alice', email: 'a@b.com', role: 'STUDENT' })
        .mockReturnValueOnce({ id: 'bob', email: 'b@b.com', role: 'STUDENT' });

      const s1 = mockServer.simulateConnection('s1');
      const s2 = mockServer.simulateConnection('s2');
      s1.simulateEvent('authenticate', 'tokenA');
      s2.simulateEvent('authenticate', 'tokenB');

      gateway.sendToUser('alice', 'ventilator:data', { pressure: 15 });

      expect(s1.emit).toHaveBeenCalledWith('ventilator:data', { pressure: 15 });
      expect(s2.emit).not.toHaveBeenCalledWith('ventilator:data', expect.anything());
    });
  });

  // --------------------------------------------------------------------------
  // getConnectedUsers() / isUserConnected()
  // --------------------------------------------------------------------------

  describe('getConnectedUsers() / isUserConnected()', () => {
    it('returns empty array initially', () => {
      expect(gateway.getConnectedUsers()).toEqual([]);
    });

    it('returns all authenticated userIds', () => {
      mockVerifyToken
        .mockReturnValueOnce({ id: 'u1', email: 'a@a.com', role: 'STUDENT' })
        .mockReturnValueOnce({ id: 'u2', email: 'b@b.com', role: 'STUDENT' });

      const s1 = mockServer.simulateConnection('s1');
      const s2 = mockServer.simulateConnection('s2');
      s1.simulateEvent('authenticate', 't1');
      s2.simulateEvent('authenticate', 't2');

      expect(gateway.getConnectedUsers()).toEqual(expect.arrayContaining(['u1', 'u2']));
      expect(gateway.getConnectedUsers()).toHaveLength(2);
    });

    it('isUserConnected returns false for unknown users', () => {
      expect(gateway.isUserConnected('nobody')).toBe(false);
    });

    it('isUserConnected returns true after authentication', () => {
      mockVerifyToken.mockReturnValue({ id: 'me', email: 'me@me.com', role: 'STUDENT' });
      const s = mockServer.simulateConnection();
      s.simulateEvent('authenticate', 'tok');
      expect(gateway.isUserConnected('me')).toBe(true);
    });

    it('updates correctly after disconnect', () => {
      mockVerifyToken.mockReturnValue({ id: 'temp', email: 't@t.com', role: 'STUDENT' });
      const s = mockServer.simulateConnection();
      s.simulateEvent('authenticate', 'tok');
      s.simulateEvent('disconnect');

      expect(gateway.isUserConnected('temp')).toBe(false);
      expect(gateway.getConnectedUsers()).toHaveLength(0);
    });
  });
});
