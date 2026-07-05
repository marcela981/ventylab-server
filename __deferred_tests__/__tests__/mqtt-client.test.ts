/**
 * @file mqtt-client.test.ts
 * @description Unit tests for MqttClient using a mock MQTT broker.
 *
 * The real `mqtt` library is replaced via jest.mock() with a fake broker
 * backed by an EventEmitter. Tests control connection events manually.
 */

import { EventEmitter } from 'events';
import { MqttClient } from '../mqtt-client';
import { VentilatorStatus, VentilationMode } from '../../../../contracts/simulation.contracts';
import type { VentilatorCommand } from '../../../../contracts/simulation.contracts';

// ============================================================================
// Mock MQTT broker
// ============================================================================

/**
 * Simulates an mqtt.MqttClient.
 * Tests can drive connection lifecycle by calling simulateConnect(),
 * simulateError(), simulateClose(), and simulateMessage().
 */
class MockMqttBroker extends EventEmitter {
  connected = false;

  end = jest.fn((_force: boolean, _opts: object, cb?: () => void) => {
    this.connected = false;
    cb?.();
  });

  subscribe = jest.fn(
    (_topic: string, _opts: object, cb?: (err: Error | null) => void) => {
      cb?.(null);
    },
  );

  publish = jest.fn(
    (
      _topic: string,
      _payload: string,
      _opts: object,
      cb?: (err?: Error) => void,
    ) => {
      cb?.();
    },
  );

  reconnect = jest.fn(() => {
    // When reconnect() is called, simulate a successful re-connection.
    setImmediate(() => this.simulateConnect());
    return this;
  });

  removeAllListeners = jest.fn(() => {
    super.removeAllListeners();
    return this;
  });

  // ---- Helpers for controlling the mock from tests ----

  simulateConnect() {
    this.connected = true;
    this.emit('connect');
  }

  simulateError(err: Error) {
    this.connected = false;
    this.emit('error', err);
  }

  simulateClose() {
    this.connected = false;
    this.emit('close');
  }

  simulateMessage(topic: string, payload: Buffer) {
    this.emit('message', topic, payload);
  }
}

// ============================================================================
// jest.mock – replace the 'mqtt' module
// ============================================================================

let mockBroker: MockMqttBroker;

jest.mock('mqtt', () => ({
  connect: jest.fn(() => {
    mockBroker = new MockMqttBroker();
    return mockBroker;
  }),
}));

// Import after mock so the module sees our replacement.
import { connect as mqttConnect } from 'mqtt';
const mockMqttConnect = mqttConnect as jest.Mock;

// ============================================================================
// Test helpers
// ============================================================================

const makeCommand = (): VentilatorCommand => ({
  mode: VentilationMode.VCV,
  tidalVolume: 500,
  respiratoryRate: 14,
  peep: 5,
  fio2: 0.4,
  pressureLimit: 30,
  timestamp: Date.now(),
});

const defaultOptions = {
  brokerUrl: 'mqtt://localhost:1883',
  reconnectInterval: 100,  // Short for tests
  maxReconnectAttempts: 3,
};

// ============================================================================
// Tests
// ============================================================================

describe('MqttClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // --------------------------------------------------------------------------
  // connect()
  // --------------------------------------------------------------------------

  describe('connect()', () => {
    it('resolves and sets status to CONNECTED on successful connect', async () => {
      const client = new MqttClient(defaultOptions);

      const connectPromise = client.connect();
      // Simulate broker accepting the connection
      mockBroker.simulateConnect();
      await connectPromise;

      expect(client.getStatus()).toBe(VentilatorStatus.CONNECTED);
      expect(client.isConnected()).toBe(true);
    });

    it('passes correct options to mqtt.connect', async () => {
      const client = new MqttClient({
        brokerUrl: 'mqtt://broker:1883',
        username: 'user',
        password: 'pass',
        keepAlive: 30,
        clientId: 'test-client',
      });

      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      const [url, opts] = mockMqttConnect.mock.calls[0];
      expect(url).toBe('mqtt://broker:1883');
      expect(opts.username).toBe('user');
      expect(opts.password).toBe('pass');
      expect(opts.keepalive).toBe(30);
      expect(opts.clientId).toBe('test-client');
      // Should disable built-in reconnect so we manage it manually
      expect(opts.reconnectPeriod).toBe(0);
    });

    it('rejects and sets status to ERROR on connection error', async () => {
      const client = new MqttClient(defaultOptions);

      const connectPromise = client.connect();
      const connectionError = new Error('ECONNREFUSED');
      mockBroker.simulateError(connectionError);

      await expect(connectPromise).rejects.toThrow('ECONNREFUSED');
      expect(client.getStatus()).toBe(VentilatorStatus.ERROR);
      expect(client.isConnected()).toBe(false);
    });

    it('is a no-op if already connected', async () => {
      const client = new MqttClient(defaultOptions);

      const p1 = client.connect();
      mockBroker.simulateConnect();
      await p1;

      // Second connect should return early
      await client.connect();
      // mqtt.connect should only have been called once
      expect(mockMqttConnect).toHaveBeenCalledTimes(1);
    });
  });

  // --------------------------------------------------------------------------
  // disconnect()
  // --------------------------------------------------------------------------

  describe('disconnect()', () => {
    it('calls client.end(true) and sets status to DISCONNECTED', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      await client.disconnect();

      expect(mockBroker.end).toHaveBeenCalledWith(true, {}, expect.any(Function));
      expect(client.getStatus()).toBe(VentilatorStatus.DISCONNECTED);
      expect(client.isConnected()).toBe(false);
    });

    it('removes all listeners on disconnect', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      await client.disconnect();

      expect(mockBroker.removeAllListeners).toHaveBeenCalled();
    });

    it('resolves immediately if not connected', async () => {
      const client = new MqttClient(defaultOptions);
      // No connect() call – client is null
      await expect(client.disconnect()).resolves.toBeUndefined();
      expect(client.getStatus()).toBe(VentilatorStatus.DISCONNECTED);
    });

    it('prevents reconnect attempts after intentional disconnect', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      await client.disconnect();

      // Simulate a 'close' event after disconnect (e.g. from the broker side)
      mockBroker.simulateClose();
      jest.runAllTimers();

      // Status must remain DISCONNECTED, not trigger reconnect
      expect(client.getStatus()).toBe(VentilatorStatus.DISCONNECTED);
    });
  });

  // --------------------------------------------------------------------------
  // publishCommand()
  // --------------------------------------------------------------------------

  describe('publishCommand()', () => {
    it('publishes to the COMMAND topic with QoS 1', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      const command = makeCommand();
      await client.publishCommand(command);

      expect(mockBroker.publish).toHaveBeenCalledWith(
        'ventilab/device/001/command',
        JSON.stringify(command),
        { qos: 1, retain: false },
        expect.any(Function),
      );
    });

    it('serializes command as JSON string', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      const command = makeCommand();
      await client.publishCommand(command);

      const publishedPayload = mockBroker.publish.mock.calls[0][1];
      expect(() => JSON.parse(publishedPayload)).not.toThrow();
      expect(JSON.parse(publishedPayload)).toMatchObject({
        mode: VentilationMode.VCV,
        tidalVolume: 500,
      });
    });

    it('throws when not connected', async () => {
      const client = new MqttClient(defaultOptions);

      await expect(client.publishCommand(makeCommand())).rejects.toThrow(
        /Cannot publish/,
      );
    });

    it('rejects if the broker returns a publish error', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      mockBroker.publish.mockImplementationOnce(
        (_t: string, _p: string, _o: object, cb?: (err?: Error) => void) => {
          cb?.(new Error('Broker write failed'));
        },
      );

      await expect(client.publishCommand(makeCommand())).rejects.toThrow(
        'Broker write failed',
      );
    });
  });

  // --------------------------------------------------------------------------
  // subscribeTelemetry()
  // --------------------------------------------------------------------------

  describe('subscribeTelemetry()', () => {
    it('subscribes to the TELEMETRY and ALARM topics with QoS 1', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      client.subscribeTelemetry(jest.fn());

      const subscribedTopics = mockBroker.subscribe.mock.calls.map(
        (call) => call[0],
      );
      expect(subscribedTopics).toContain('ventilab/device/001/telemetry');
      expect(subscribedTopics).toContain('ventilab/device/001/alarm');

      type SubscribeOpts = { qos: 0 | 1 | 2 };
      const qosValues = mockBroker.subscribe.mock.calls.map(
        (call) => (call[1] as SubscribeOpts).qos,
      );
      expect(qosValues).toEqual([1, 1]);
    });

    it('invokes callback with raw buffer for telemetry messages', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      const callback = jest.fn();
      client.subscribeTelemetry(callback);

      const payload = Buffer.from([0xff, 0xa1, 0x02, 0x12, 0x34, 0xab]);
      mockBroker.simulateMessage('ventilab/device/001/telemetry', payload);

      expect(callback).toHaveBeenCalledWith(payload);
    });

    it('invokes callback for alarm messages too', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      const callback = jest.fn();
      client.subscribeTelemetry(callback);

      const alarmPayload = Buffer.from([0xff, 0xa4, 0x01, 0x02, 0xff]);
      mockBroker.simulateMessage('ventilab/device/001/alarm', alarmPayload);

      expect(callback).toHaveBeenCalledWith(alarmPayload);
    });

    it('ignores messages on unrelated topics', async () => {
      const client = new MqttClient(defaultOptions);
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      const callback = jest.fn();
      client.subscribeTelemetry(callback);

      mockBroker.simulateMessage('unrelated/topic', Buffer.from([0x00]));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // Reconnect logic
  // --------------------------------------------------------------------------

  describe('Reconnect (exponential backoff)', () => {
    it('attempts reconnect after unexpected close', async () => {
      const client = new MqttClient({
        ...defaultOptions,
        reconnectInterval: 100,
        maxReconnectAttempts: 3,
      });
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      // Simulate an unexpected connection drop
      mockBroker.simulateClose();

      expect(client.getStatus()).toBe(VentilatorStatus.DISCONNECTED);

      // Advance timers so the first reconnect fires (delay = 100ms * 2^0 = 100ms)
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // flush setImmediate inside reconnect()

      expect(mockBroker.reconnect).toHaveBeenCalledTimes(1);
    });

    it('uses exponential backoff for subsequent attempts', async () => {
      const client = new MqttClient({
        ...defaultOptions,
        reconnectInterval: 100,
        maxReconnectAttempts: 5,
      });
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      // Attempt 1's reconnect() emits 'close' so attempt 2 is triggered.
      mockBroker.reconnect.mockImplementationOnce(() => {
        mockBroker.emit('close');
        return mockBroker;
      });

      // First drop → schedules attempt 1 at 100ms (100 * 2^0)
      mockBroker.simulateClose();
      // Attempt 1 fires; reconnect emits 'close' → schedules attempt 2 at 200ms (100 * 2^1)
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      // Attempt 2 fires after the doubled delay
      jest.advanceTimersByTime(200);
      await Promise.resolve();

      expect(mockBroker.reconnect).toHaveBeenCalledTimes(2);
    });

    it('stops reconnecting after maxReconnectAttempts', async () => {
      const client = new MqttClient({
        ...defaultOptions,
        reconnectInterval: 10,
        maxReconnectAttempts: 2,
      });
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      // Make reconnect() always fail by re-emitting close
      mockBroker.reconnect.mockImplementation(() => {
        mockBroker.emit('close');
        return mockBroker;
      });

      mockBroker.simulateClose();

      // Advance through all retry windows (10ms, 20ms, 40ms...)
      for (let i = 0; i < 5; i++) {
        jest.runAllTimers();
        await Promise.resolve();
      }

      expect(client.getStatus()).toBe(VentilatorStatus.ERROR);
      // Should have attempted exactly maxReconnectAttempts times
      expect(mockBroker.reconnect).toHaveBeenCalledTimes(2);
    });

    it('resubscribes to telemetry after reconnect', async () => {
      const client = new MqttClient({
        ...defaultOptions,
        reconnectInterval: 100,
      });
      const connectPromise = client.connect();
      mockBroker.simulateConnect();
      await connectPromise;

      const callback = jest.fn();
      client.subscribeTelemetry(callback);

      const initialSubscribeCalls = mockBroker.subscribe.mock.calls.length;

      // Drop and reconnect
      mockBroker.simulateClose();
      // Fire the reconnect timer (100ms)
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      // Fire the setImmediate that MockBroker.reconnect schedules for simulateConnect().
      // jest.useFakeTimers() fakes setImmediate, so we must advance the clock to flush it.
      jest.runAllTimers();
      await Promise.resolve();
      // The persistent 'connect' handler calls resubscribe()
      expect(mockBroker.subscribe.mock.calls.length).toBeGreaterThan(
        initialSubscribeCalls,
      );
    });
  });

  // --------------------------------------------------------------------------
  // getStatus() / isConnected()
  // --------------------------------------------------------------------------

  describe('getStatus() / isConnected()', () => {
    it('starts as DISCONNECTED', () => {
      const client = new MqttClient(defaultOptions);
      expect(client.getStatus()).toBe(VentilatorStatus.DISCONNECTED);
      expect(client.isConnected()).toBe(false);
    });

    it('is CONNECTING while waiting for broker', () => {
      const client = new MqttClient(defaultOptions);
      // Don't await – just start the connection
      client.connect().catch(() => {});
      expect(client.getStatus()).toBe(VentilatorStatus.CONNECTING);
    });
  });
});
