/**
 * @file simulation.health.test.ts
 * @description Unit tests for SimulationHealth.
 *
 * SimulationHealth has no I/O; all dependencies are pure in-memory stubs.
 */

import { SimulationHealth } from '../simulation.health';
import { VentilatorStatus } from '../../../../contracts/simulation.contracts';

// ============================================================================
// Stubs
// ============================================================================

function makeMqttStub(status: VentilatorStatus = VentilatorStatus.CONNECTED) {
  return {
    getStatus: jest.fn().mockReturnValue(status),
  } as any;
}

function makeGatewayStub(userIds: string[] = []) {
  return {
    getConnectedUsers: jest.fn().mockReturnValue(userIds),
  } as any;
}

function makeReservationGetter(
  snapshot: { isReserved: boolean; currentUser?: string; endsAt?: number } = { isReserved: false },
) {
  return jest.fn().mockReturnValue(snapshot);
}

// ============================================================================
// Tests
// ============================================================================

describe('SimulationHealth', () => {
  // --------------------------------------------------------------------------
  // snapshot() — initial state
  // --------------------------------------------------------------------------

  describe('snapshot() initial state', () => {
    it('returns DISCONNECTED mqtt status when client is disconnected', () => {
      const health = new SimulationHealth(
        makeMqttStub(VentilatorStatus.DISCONNECTED),
        makeGatewayStub(),
        makeReservationGetter(),
      );
      expect(health.snapshot().mqtt.status).toBe(VentilatorStatus.DISCONNECTED);
    });

    it('returns CONNECTED mqtt status when client is connected', () => {
      const health = new SimulationHealth(
        makeMqttStub(VentilatorStatus.CONNECTED),
        makeGatewayStub(),
        makeReservationGetter(),
      );
      expect(health.snapshot().mqtt.status).toBe(VentilatorStatus.CONNECTED);
    });

    it('returns ws.connectedUsers = 0 when no users are authenticated', () => {
      const health = new SimulationHealth(
        makeMqttStub(),
        makeGatewayStub([]),
        makeReservationGetter(),
      );
      expect(health.snapshot().ws.connectedUsers).toBe(0);
      expect(health.snapshot().ws.userIds).toEqual([]);
    });

    it('returns ws.connectedUsers = n with the correct userIds', () => {
      const health = new SimulationHealth(
        makeMqttStub(),
        makeGatewayStub(['user-1', 'user-2']),
        makeReservationGetter(),
      );
      const snap = health.snapshot();
      expect(snap.ws.connectedUsers).toBe(2);
      expect(snap.ws.userIds).toEqual(['user-1', 'user-2']);
    });

    it('returns telemetry with null lastFrameAt and null lastFrameAgeMs before any frames', () => {
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), makeReservationGetter());
      const snap = health.snapshot();
      expect(snap.telemetry.lastFrameAt).toBeNull();
      expect(snap.telemetry.lastFrameAgeMs).toBeNull();
      expect(snap.telemetry.framesPerSecond).toBe(0);
    });

    it('returns reservation.isReserved = false initially', () => {
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), makeReservationGetter());
      expect(health.snapshot().reservation.isReserved).toBe(false);
    });

    it('reflects reservation state from the getter', () => {
      const getter = makeReservationGetter({ isReserved: true, currentUser: 'user-7', endsAt: 9999 });
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), getter);
      const snap = health.snapshot();
      expect(snap.reservation.isReserved).toBe(true);
      expect(snap.reservation.currentUser).toBe('user-7');
      expect(snap.reservation.endsAt).toBe(9999);
    });

    it('includes the broker URL and topic from SIMULATION_CONFIG', () => {
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), makeReservationGetter());
      const snap = health.snapshot();
      expect(typeof snap.mqtt.brokerUrl).toBe('string');
      expect(snap.mqtt.brokerUrl.length).toBeGreaterThan(0);
      expect(typeof snap.mqtt.topic).toBe('string');
      expect(snap.mqtt.topic.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // recordFrame() — increments framesPerSecond
  // --------------------------------------------------------------------------

  describe('recordFrame()', () => {
    it('increments framesPerSecond by 1 per call within the 1 s window', () => {
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), makeReservationGetter());

      health.recordFrame();
      expect(health.snapshot().telemetry.framesPerSecond).toBe(1);

      health.recordFrame();
      expect(health.snapshot().telemetry.framesPerSecond).toBe(2);

      health.recordFrame();
      expect(health.snapshot().telemetry.framesPerSecond).toBe(3);
    });

    it('sets lastFrameAt to a non-null timestamp after the first frame', () => {
      const before = Date.now();
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), makeReservationGetter());

      health.recordFrame();
      const snap = health.snapshot();

      expect(snap.telemetry.lastFrameAt).not.toBeNull();
      expect(snap.telemetry.lastFrameAt!).toBeGreaterThanOrEqual(before);
      expect(snap.telemetry.lastFrameAgeMs).not.toBeNull();
      expect(snap.telemetry.lastFrameAgeMs!).toBeGreaterThanOrEqual(0);
    });

    it('does not count frames older than 1 s (rolling window)', () => {
      jest.useFakeTimers();
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), makeReservationGetter());

      // Record 5 frames at t=0
      for (let i = 0; i < 5; i++) health.recordFrame();
      expect(health.snapshot().telemetry.framesPerSecond).toBe(5);

      // Advance time by 1001 ms — old frames fall out of the window
      jest.advanceTimersByTime(1001);

      // Record 2 new frames
      health.recordFrame();
      health.recordFrame();

      // Only the 2 new frames should be counted
      expect(health.snapshot().telemetry.framesPerSecond).toBe(2);

      jest.useRealTimers();
    });

    it('framesPerSecond returns 0 after all frames expire from the window', () => {
      jest.useFakeTimers();
      const health = new SimulationHealth(makeMqttStub(), makeGatewayStub(), makeReservationGetter());

      health.recordFrame();
      health.recordFrame();

      jest.advanceTimersByTime(1001);

      expect(health.snapshot().telemetry.framesPerSecond).toBe(0);
      expect(health.snapshot().telemetry.lastFrameAt).toBeNull();

      jest.useRealTimers();
    });
  });
});
