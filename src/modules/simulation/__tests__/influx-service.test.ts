/**
 * Unit tests for InfluxTelemetryService.
 *
 * Mocks the @influxdata/influxdb-client SDK so no real InfluxDB is needed.
 */

// ---------------------------------------------------------------------------
// Mock setup – must come before the import
// ---------------------------------------------------------------------------

const mockWritePoint = jest.fn();
const mockUseDefaultTags = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

const mockGetWriteApi = jest.fn().mockReturnValue({
  writePoint: mockWritePoint,
  useDefaultTags: mockUseDefaultTags,
  close: mockClose,
});

jest.mock('@influxdata/influxdb-client', () => ({
  InfluxDB: jest.fn().mockImplementation(() => ({
    getWriteApi: mockGetWriteApi,
  })),
  Point: jest.fn().mockImplementation(() => {
    const point: Record<string, any> = {};
    point.tag = jest.fn().mockReturnValue(point);
    point.floatField = jest.fn().mockReturnValue(point);
    point.timestamp = jest.fn().mockReturnValue(point);
    return point;
  }),
}));

import { InfluxTelemetryService } from '../influx-service';
import type { TelemetryPayload } from '../mqtt-client';
import { Point } from '@influxdata/influxdb-client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createOptions() {
  return {
    url: 'http://localhost:8086',
    token: 'test-token',
    org: 'test-org',
    bucket: 'test-bucket',
  };
}

function createPayload(overrides?: Partial<TelemetryPayload>): TelemetryPayload {
  return {
    pressure: 20.5,
    flow: 35.0,
    volume: 450,
    timestamp: Date.now(),
    deviceId: 'device-001',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InfluxTelemetryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  describe('constructor', () => {
    it('creates InfluxDB client and WriteApi with correct parameters', () => {
      const opts = createOptions();
      new InfluxTelemetryService(opts);

      const { InfluxDB } = require('@influxdata/influxdb-client');
      expect(InfluxDB).toHaveBeenCalledWith({
        url: opts.url,
        token: opts.token,
      });

      expect(mockGetWriteApi).toHaveBeenCalledWith(
        opts.org,
        opts.bucket,
        'ms',
        expect.objectContaining({
          flushInterval: 500,
          batchSize: 200,
        }),
      );
    });

    it('uses custom flushInterval and batchSize when provided', () => {
      new InfluxTelemetryService({
        ...createOptions(),
        flushInterval: 1000,
        batchSize: 500,
      });

      expect(mockGetWriteApi).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'ms',
        expect.objectContaining({
          flushInterval: 1000,
          batchSize: 500,
        }),
      );
    });

    it('sets default tags with source=ventylab-server', () => {
      new InfluxTelemetryService(createOptions());
      expect(mockUseDefaultTags).toHaveBeenCalledWith({ source: 'ventylab-server' });
    });
  });

  // -----------------------------------------------------------------------
  // writeTelemetry
  // -----------------------------------------------------------------------

  describe('writeTelemetry', () => {
    it('creates a Point with correct measurement, tag, and required fields', () => {
      const service = new InfluxTelemetryService(createOptions());
      const payload = createPayload();

      service.writeTelemetry(payload);

      // Point constructor called with measurement name
      expect(Point).toHaveBeenCalledWith('telemetry');

      // The mock point instance
      const pointInstance = (Point as unknown as jest.Mock).mock.results[0].value;
      expect(pointInstance.tag).toHaveBeenCalledWith('deviceId', payload.deviceId);
      expect(pointInstance.floatField).toHaveBeenCalledWith('pressure', payload.pressure);
      expect(pointInstance.floatField).toHaveBeenCalledWith('flow', payload.flow);
      expect(pointInstance.floatField).toHaveBeenCalledWith('volume', payload.volume);
      expect(pointInstance.timestamp).toHaveBeenCalledWith(payload.timestamp);

      // writePoint is called on the WriteApi
      expect(mockWritePoint).toHaveBeenCalledWith(pointInstance);
    });

    it('includes optional pco2 field when present', () => {
      const service = new InfluxTelemetryService(createOptions());
      const payload = createPayload({ pco2: 40 });

      service.writeTelemetry(payload);

      const pointInstance = (Point as unknown as jest.Mock).mock.results[0].value;
      expect(pointInstance.floatField).toHaveBeenCalledWith('pco2', 40);
    });

    it('includes optional spo2 field when present', () => {
      const service = new InfluxTelemetryService(createOptions());
      const payload = createPayload({ spo2: 98 });

      service.writeTelemetry(payload);

      const pointInstance = (Point as unknown as jest.Mock).mock.results[0].value;
      expect(pointInstance.floatField).toHaveBeenCalledWith('spo2', 98);
    });

    it('does NOT add pco2/spo2 when they are undefined', () => {
      const service = new InfluxTelemetryService(createOptions());
      const payload = createPayload(); // no pco2/spo2

      service.writeTelemetry(payload);

      const pointInstance = (Point as unknown as jest.Mock).mock.results[0].value;
      const floatFieldCalls = pointInstance.floatField.mock.calls.map(
        (c: any[]) => c[0],
      );
      expect(floatFieldCalls).not.toContain('pco2');
      expect(floatFieldCalls).not.toContain('spo2');
    });
  });

  // -----------------------------------------------------------------------
  // close
  // -----------------------------------------------------------------------

  describe('close', () => {
    it('calls writeApi.close()', async () => {
      const service = new InfluxTelemetryService(createOptions());
      await service.close();
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('does not throw when writeApi.close() rejects', async () => {
      mockClose.mockRejectedValueOnce(new Error('flush timeout'));
      const service = new InfluxTelemetryService(createOptions());
      // Should not throw
      await expect(service.close()).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // fromEnv
  // -----------------------------------------------------------------------

  describe('fromEnv', () => {
    const envBackup = { ...process.env };

    afterEach(() => {
      process.env = { ...envBackup };
    });

    it('returns an InfluxTelemetryService when all env vars are set', () => {
      process.env.INFLUXDB_URL = 'http://localhost:8086';
      process.env.INFLUXDB_TOKEN = 'tok';
      process.env.INFLUXDB_ORG = 'org';
      process.env.INFLUXDB_BUCKET = 'bkt';

      const result = InfluxTelemetryService.fromEnv();
      expect(result).toBeInstanceOf(InfluxTelemetryService);
    });

    it('returns null when INFLUXDB_URL is missing', () => {
      delete process.env.INFLUXDB_URL;
      process.env.INFLUXDB_TOKEN = 'tok';
      process.env.INFLUXDB_ORG = 'org';
      process.env.INFLUXDB_BUCKET = 'bkt';

      expect(InfluxTelemetryService.fromEnv()).toBeNull();
    });

    it('returns null when INFLUXDB_TOKEN is missing', () => {
      process.env.INFLUXDB_URL = 'http://localhost:8086';
      delete process.env.INFLUXDB_TOKEN;
      process.env.INFLUXDB_ORG = 'org';
      process.env.INFLUXDB_BUCKET = 'bkt';

      expect(InfluxTelemetryService.fromEnv()).toBeNull();
    });
  });
});
