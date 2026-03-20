/**
 * @file simulation.service.test.ts
 * @description Unit tests for SimulationService.
 *
 * All external dependencies are replaced with hand-rolled jest mocks:
 *  - PrismaClient  → mockPrisma (plain object with jest.fn() methods)
 *  - ISimulationGateway, IVentilatorConnection, IHexParser, IHexEncoder
 *    → createMock*() factories returning jest.Mocked<T>
 *
 * Prisma is cast as `any` throughout because the new models
 * (VentilatorReservation, SimulatorSession) won't exist in the
 * generated client type until `prisma generate` is run.
 */

import { SimulationService } from '../simulation.service';
import {
  type ISimulationGateway,
  type IVentilatorConnection,
  type IHexParser,
  type IHexEncoder,
  type VentilatorCommand,
  type HexPressureData,
  type HexFlowData,
  type HexVolumeData,
  type HexAlarmData,
  HexMessageType,
  VentilatorStatus,
  VentilationMode,
  AlarmType,
  AlarmSeverity,
} from '../../../../contracts/simulation.contracts';

// ============================================================================
// Mock factories
// ============================================================================

function createMockPrisma() {
  return {
    ventilatorReservation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    simulatorSession: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
}

function createMockGateway(): jest.Mocked<ISimulationGateway> {
  return {
    broadcastData: jest.fn(),
    sendToUser: jest.fn(),
    getConnectedUsers: jest.fn().mockReturnValue([]),
    isUserConnected: jest.fn().mockReturnValue(false),
  };
}

function createMockConnection(): jest.Mocked<IVentilatorConnection> {
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    publishCommand: jest.fn().mockResolvedValue(undefined),
    subscribeTelemetry: jest.fn(),
    getStatus: jest.fn().mockReturnValue(VentilatorStatus.CONNECTED),
    isConnected: jest.fn().mockReturnValue(true),
  };
}

function createMockParser(): jest.Mocked<IHexParser> {
  return {
    parse: jest.fn().mockReturnValue(null),
    validate: jest.fn().mockReturnValue(true),
    calculateChecksum: jest.fn().mockReturnValue(0),
  };
}

function createMockEncoder(): jest.Mocked<IHexEncoder> {
  return {
    encode: jest.fn().mockReturnValue(Buffer.from([])),
    validateCommand: jest.fn().mockReturnValue(true),
    getValidationErrors: jest.fn().mockReturnValue([]),
  };
}

// ============================================================================
// Helpers for building parsed frame objects
// ============================================================================

const TS = 1_000_000;

function makePressure(pressure: number): HexPressureData {
  return { type: HexMessageType.PRESSURE, pressure, timestamp: TS };
}
function makeFlow(flow: number): HexFlowData {
  return { type: HexMessageType.FLOW, flow, timestamp: TS };
}
function makeVolume(volume: number): HexVolumeData {
  return { type: HexMessageType.VOLUME, volume, timestamp: TS };
}
function makeAlarm(
  alarmType: AlarmType = AlarmType.HIGH_PRESSURE,
  severity: AlarmSeverity = AlarmSeverity.CRITICAL,
): HexAlarmData {
  return { type: HexMessageType.ALARM, alarmType, severity, timestamp: TS };
}

const DUMMY_BUF = Buffer.from([0xff, 0xa1, 0x02, 0x00, 0x64, 0x26]);

const VALID_COMMAND: VentilatorCommand = {
  mode: VentilationMode.VCV,
  tidalVolume: 500,
  respiratoryRate: 15,
  peep: 5,
  fio2: 0.4,
  timestamp: Date.now(),
};

// ============================================================================
// Tests
// ============================================================================

describe('SimulationService', () => {
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockGateway: jest.Mocked<ISimulationGateway>;
  let mockConnection: jest.Mocked<IVentilatorConnection>;
  let mockParser: jest.Mocked<IHexParser>;
  let mockEncoder: jest.Mocked<IHexEncoder>;
  let service: SimulationService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = createMockPrisma();
    mockGateway = createMockGateway();
    mockConnection = createMockConnection();
    mockParser = createMockParser();
    mockEncoder = createMockEncoder();

    service = new SimulationService(
      mockPrisma as any,
      mockGateway,
      mockConnection,
      mockParser,
      mockEncoder,
    );
  });

  // --------------------------------------------------------------------------
  // initialize()
  // --------------------------------------------------------------------------

  describe('initialize()', () => {
    it('connects to the MQTT broker', async () => {
      await service.initialize();
      expect(mockConnection.connect).toHaveBeenCalledTimes(1);
    });

    it('subscribes to telemetry after connecting', async () => {
      await service.initialize();
      expect(mockConnection.subscribeTelemetry).toHaveBeenCalledWith(expect.any(Function));
    });

    it('the registered telemetry callback delegates to handleTelemetryBuffer', async () => {
      await service.initialize();
      const [callback] = mockConnection.subscribeTelemetry.mock.calls[0] as [(d: Buffer) => void];

      mockParser.validate.mockReturnValue(false);
      callback(DUMMY_BUF);

      // validate() is the first thing handleTelemetryBuffer calls
      expect(mockParser.validate).toHaveBeenCalledWith(DUMMY_BUF);
    });
  });

  // --------------------------------------------------------------------------
  // shutdown()
  // --------------------------------------------------------------------------

  describe('shutdown()', () => {
    it('disconnects the MQTT connection', async () => {
      await service.shutdown();
      expect(mockConnection.disconnect).toHaveBeenCalledTimes(1);
    });

    it('clears active alarms on shutdown', async () => {
      // Inject an alarm via handleTelemetryBuffer
      mockParser.parse.mockReturnValue(makeAlarm());
      service.handleTelemetryBuffer(DUMMY_BUF);

      await service.shutdown();

      // After shutdown alarms are gone – verify via getVentilatorStatus
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);
      const status = await service.getVentilatorStatus();
      expect(status.activeAlarms).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // handleTelemetryBuffer()
  // --------------------------------------------------------------------------

  describe('handleTelemetryBuffer()', () => {
    it('discards buffer and does nothing when validate() returns false', () => {
      mockParser.validate.mockReturnValue(false);
      service.handleTelemetryBuffer(DUMMY_BUF);

      expect(mockParser.parse).not.toHaveBeenCalled();
      expect(mockGateway.broadcastData).not.toHaveBeenCalled();
    });

    it('does nothing when parse() returns null (valid frame but no data)', () => {
      mockParser.validate.mockReturnValue(true);
      mockParser.parse.mockReturnValue(null);

      service.handleTelemetryBuffer(DUMMY_BUF);

      expect(mockGateway.broadcastData).not.toHaveBeenCalled();
    });

    it('broadcasts ventilator:data on a PRESSURE frame', () => {
      mockParser.parse.mockReturnValue(makePressure(15.3));

      service.handleTelemetryBuffer(DUMMY_BUF);

      expect(mockGateway.broadcastData).toHaveBeenCalledWith(
        'ventilator:data',
        expect.objectContaining({ pressure: 15.3 }),
      );
    });

    it('broadcasts ventilator:data on a FLOW frame', () => {
      mockParser.parse.mockReturnValue(makeFlow(-5.0));

      service.handleTelemetryBuffer(DUMMY_BUF);

      expect(mockGateway.broadcastData).toHaveBeenCalledWith(
        'ventilator:data',
        expect.objectContaining({ flow: -5.0 }),
      );
    });

    it('broadcasts ventilator:data on a VOLUME frame', () => {
      mockParser.parse.mockReturnValue(makeVolume(480));

      service.handleTelemetryBuffer(DUMMY_BUF);

      expect(mockGateway.broadcastData).toHaveBeenCalledWith(
        'ventilator:data',
        expect.objectContaining({ volume: 480 }),
      );
    });

    it('accumulates reading state across multiple frames', () => {
      mockParser.parse.mockReturnValueOnce(makePressure(20.0));
      service.handleTelemetryBuffer(DUMMY_BUF);

      mockParser.parse.mockReturnValueOnce(makeFlow(30.0));
      service.handleTelemetryBuffer(DUMMY_BUF);

      mockParser.parse.mockReturnValueOnce(makeVolume(500));
      service.handleTelemetryBuffer(DUMMY_BUF);

      // Last call should contain all three accumulated values
      const lastCall = mockGateway.broadcastData.mock.calls.at(-1)!;
      expect(lastCall[0]).toBe('ventilator:data');
      expect(lastCall[1]).toMatchObject({ pressure: 20.0, flow: 30.0, volume: 500 });
    });

    it('broadcasts ventilator:alarm (NOT ventilator:data) on an ALARM frame', () => {
      mockParser.parse.mockReturnValue(makeAlarm(AlarmType.APNEA, AlarmSeverity.HIGH));

      service.handleTelemetryBuffer(DUMMY_BUF);

      expect(mockGateway.broadcastData).toHaveBeenCalledTimes(1);
      const [event, payload] = mockGateway.broadcastData.mock.calls[0];
      expect(event).toBe('ventilator:alarm');
      expect(payload).toMatchObject({
        type: AlarmType.APNEA,
        severity: AlarmSeverity.HIGH,
        active: true,
        acknowledged: false,
      });
    });

    it('stores alarm in activeAlarms map', async () => {
      mockParser.parse.mockReturnValue(makeAlarm(AlarmType.HIGH_PRESSURE, AlarmSeverity.CRITICAL));
      service.handleTelemetryBuffer(DUMMY_BUF);

      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);
      const status = await service.getVentilatorStatus();
      expect(status.activeAlarms).toHaveLength(1);
      expect(status.activeAlarms[0].type).toBe(AlarmType.HIGH_PRESSURE);
    });

    it('updates lastDataTimestamp after a valid frame', async () => {
      const before = Date.now();
      mockParser.parse.mockReturnValue(makePressure(10));
      service.handleTelemetryBuffer(DUMMY_BUF);

      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);
      const statusResponse = await service.getVentilatorStatus();
      expect(statusResponse.lastDataTimestamp).toBeGreaterThanOrEqual(before);
    });

    it('reading includes deviceId', () => {
      mockParser.parse.mockReturnValue(makePressure(5));
      service.handleTelemetryBuffer(DUMMY_BUF);

      const [, payload] = mockGateway.broadcastData.mock.calls[0];
      expect((payload as any).deviceId).toBe('ventilab-device-001');
    });
  });

  // --------------------------------------------------------------------------
  // sendCommand()
  // --------------------------------------------------------------------------

  describe('sendCommand()', () => {
    it('returns success:false with errors when command is invalid', async () => {
      mockEncoder.getValidationErrors.mockReturnValue(['tidalVolume out of range']);

      const result = await service.sendCommand({ command: VALID_COMMAND });

      expect(result.success).toBe(false);
      expect(result.errors).toContain('tidalVolume out of range');
      expect(mockConnection.publishCommand).not.toHaveBeenCalled();
    });

    it('publishes command and returns success:true when command is valid', async () => {
      const result = await service.sendCommand({ command: VALID_COMMAND });

      expect(mockConnection.publishCommand).toHaveBeenCalledWith(VALID_COMMAND);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Command sent successfully');
    });

    it('returns a commandId and timestamp on success', async () => {
      const result = await service.sendCommand({ command: VALID_COMMAND });

      expect(result.commandId).toBeDefined();
      expect(typeof result.timestamp).toBe('number');
    });
  });

  // --------------------------------------------------------------------------
  // reserveVentilator()
  // --------------------------------------------------------------------------

  describe('reserveVentilator()', () => {
    const REQ = { userId: 'user-1', durationMinutes: 30 };

    it('returns success:false with currentUser when already reserved', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue({
        id: 'res-existing', userId: 'other-user', status: 'ACTIVE',
      });

      const result = await service.reserveVentilator(REQ);

      expect(result.success).toBe(false);
      expect(result.currentUser).toBe('other-user');
      expect(mockPrisma.ventilatorReservation.create).not.toHaveBeenCalled();
    });

    it('creates reservation and returns success:true with times when free', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);
      mockPrisma.ventilatorReservation.create.mockResolvedValue({ id: 'res-new' });

      const result = await service.reserveVentilator(REQ);

      expect(result.success).toBe(true);
      expect(result.reservationId).toBe('res-new');
      expect(typeof result.startTime).toBe('number');
      expect(typeof result.endTime).toBe('number');
      expect(result.endTime! - result.startTime!).toBeCloseTo(30 * 60 * 1000, -3);
    });

    it('broadcasts ventilator:reserved when reservation succeeds', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);
      mockPrisma.ventilatorReservation.create.mockResolvedValue({ id: 'res-new' });

      await service.reserveVentilator(REQ);

      expect(mockGateway.broadcastData).toHaveBeenCalledWith(
        'ventilator:reserved',
        expect.objectContaining({ userId: 'user-1', reservationId: 'res-new' }),
      );
    });

    it('returns existing reservation when same user tries to reserve again (recovery)', async () => {
      const endDate = new Date(Date.now() + 15 * 60_000);
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue({
        id: 'res-existing', userId: 'user-1', status: 'ACTIVE',
        startTime: new Date(), endTime: endDate,
      });

      const result = await service.reserveVentilator(REQ);

      expect(result.success).toBe(true);
      expect(result.reservationId).toBe('res-existing');
      expect(result.message).toBe('Reservation recovered');
      expect(mockPrisma.ventilatorReservation.create).not.toHaveBeenCalled();
    });

    it('calls expireOverdueReservations (updateMany) before processing', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);
      mockPrisma.ventilatorReservation.create.mockResolvedValue({ id: 'res-new' });

      await service.reserveVentilator(REQ);

      expect(mockPrisma.ventilatorReservation.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          endTime: { lt: expect.any(Date) },
        },
        data: { status: 'EXPIRED' },
      });
    });
  });

  // --------------------------------------------------------------------------
  // releaseVentilator()
  // --------------------------------------------------------------------------

  describe('releaseVentilator()', () => {
    it('throws when the user has no active reservation', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);

      await expect(service.releaseVentilator('user-1')).rejects.toThrow(
        'No active reservation found for user user-1',
      );
    });

    it('deactivates the reservation and broadcasts release', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue({
        id: 'res-1', userId: 'user-1', status: 'ACTIVE',
      });
      mockPrisma.ventilatorReservation.update.mockResolvedValue({});

      await service.releaseVentilator('user-1');

      expect(mockPrisma.ventilatorReservation.update).toHaveBeenCalledWith({
        where: { id: 'res-1' },
        data: { status: 'COMPLETED', releasedAt: expect.any(Date) },
      });
      expect(mockGateway.broadcastData).toHaveBeenCalledWith(
        'ventilator:released',
        { userId: 'user-1' },
      );
    });
  });

  // --------------------------------------------------------------------------
  // getVentilatorStatus()
  // --------------------------------------------------------------------------

  describe('getVentilatorStatus()', () => {
    it('returns the MQTT connection status', async () => {
      mockConnection.getStatus.mockReturnValue(VentilatorStatus.DISCONNECTED);
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);

      const result = await service.getVentilatorStatus();

      expect(result.status).toBe(VentilatorStatus.DISCONNECTED);
    });

    it('returns isReserved:false when no active reservation', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);

      const result = await service.getVentilatorStatus();

      expect(result.isReserved).toBe(false);
      expect(result.currentUser).toBeUndefined();
    });

    it('returns isReserved:true with currentUser and endTime when reserved', async () => {
      const endDate = new Date(Date.now() + 60_000);
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue({
        id: 'res-1', userId: 'user-42', endTime: endDate, status: 'ACTIVE',
      });

      const result = await service.getVentilatorStatus();

      expect(result.isReserved).toBe(true);
      expect(result.currentUser).toBe('user-42');
      expect(result.reservationId).toBe('res-1');
      expect(result.reservationEndsAt).toBe(endDate.getTime());
    });

    it('auto-expires overdue reservations before returning status', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);

      await service.getVentilatorStatus();

      expect(mockPrisma.ventilatorReservation.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          endTime: { lt: expect.any(Date) },
        },
        data: { status: 'EXPIRED' },
      });
    });

    it('uses default deviceId and queries with it', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);

      await service.getVentilatorStatus();

      expect(mockPrisma.ventilatorReservation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deviceId: 'ventilab-device-001' }),
        }),
      );
    });

    it('uses the provided deviceId in the query', async () => {
      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);

      await service.getVentilatorStatus('device-999');

      expect(mockPrisma.ventilatorReservation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deviceId: 'device-999' }),
        }),
      );
    });

    it('returns activeAlarms from in-memory map', async () => {
      mockParser.parse.mockReturnValue(makeAlarm(AlarmType.DISCONNECTION, AlarmSeverity.MEDIUM));
      service.handleTelemetryBuffer(DUMMY_BUF);

      mockPrisma.ventilatorReservation.findFirst.mockResolvedValue(null);
      const result = await service.getVentilatorStatus();

      expect(result.activeAlarms).toHaveLength(1);
      expect(result.activeAlarms[0].type).toBe(AlarmType.DISCONNECTION);
    });
  });

  // --------------------------------------------------------------------------
  // saveSession()
  // --------------------------------------------------------------------------

  describe('saveSession()', () => {
    const SESSION_REQ = {
      userId: 'user-1',
      isRealVentilator: false,
      parametersLog: [VALID_COMMAND],
      ventilatorData: [],
    };

    it('creates a SimulatorSession record in the DB', async () => {
      mockPrisma.simulatorSession.create.mockResolvedValue({ id: 'session-abc' });

      await service.saveSession(SESSION_REQ);

      expect(mockPrisma.simulatorSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            isRealVentilator: false,
            parametersLog: [VALID_COMMAND],
          }),
        }),
      );
    });

    it('returns success:true with the created sessionId', async () => {
      mockPrisma.simulatorSession.create.mockResolvedValue({ id: 'session-abc' });

      const result = await service.saveSession(SESSION_REQ);

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('session-abc');
      expect(typeof result.timestamp).toBe('number');
    });
  });

  // --------------------------------------------------------------------------
  // getUserSessions()
  // --------------------------------------------------------------------------

  describe('getUserSessions()', () => {
    it('returns sessions ordered by startedAt desc', async () => {
      const sessions = [{ id: 's1' }, { id: 's2' }];
      mockPrisma.simulatorSession.findMany.mockResolvedValue(sessions);

      const result = await service.getUserSessions('user-1');

      expect(mockPrisma.simulatorSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { startedAt: 'desc' },
        }),
      );
      expect(result).toBe(sessions);
    });

    it('applies take limit when provided', async () => {
      mockPrisma.simulatorSession.findMany.mockResolvedValue([]);

      await service.getUserSessions('user-1', 5);

      expect(mockPrisma.simulatorSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('does not add take when limit is omitted', async () => {
      mockPrisma.simulatorSession.findMany.mockResolvedValue([]);

      await service.getUserSessions('user-1');

      const [call] = mockPrisma.simulatorSession.findMany.mock.calls;
      expect(call[0]).not.toHaveProperty('take');
    });
  });
});
