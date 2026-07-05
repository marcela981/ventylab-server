/**
 * @file hex-parser.test.ts
 * @description Unit tests for HexParser.
 *
 * Frame format (per spec):
 *   [START=0xFF] [TYPE] [LENGTH] [DATA...] [CHECKSUM]
 *
 * Checksum: XOR of all bytes in the frame except the last one.
 *
 * Helper buildFrame() constructs a valid frame from type + data so that
 * every test drives the same byte-level contract.
 */

import { HexParser } from '../hex-parser';
import {
  HexMessageType,
  AlarmType,
  AlarmSeverity,
} from '../../../../contracts/simulation.contracts';

// ============================================================================
// Helper
// ============================================================================

/**
 * Builds a complete, valid frame buffer:
 *   [0xFF, type, data.length, ...data, checksum]
 * where checksum = XOR of all preceding bytes.
 */
function buildFrame(type: number, data: number[]): Buffer {
  const header = [0xff, type, data.length];
  const withoutChecksum = [...header, ...data];
  const checksum = withoutChecksum.reduce((acc, b) => acc ^ b, 0);
  return Buffer.from([...withoutChecksum, checksum]);
}

// ============================================================================
// Tests
// ============================================================================

describe('HexParser', () => {
  let parser: HexParser;

  beforeEach(() => {
    parser = new HexParser();
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // calculateChecksum()
  // --------------------------------------------------------------------------

  describe('calculateChecksum()', () => {
    it('returns XOR of all bytes except the last', () => {
      // [0x01, 0x02, 0x03, 0x??] → checksum = 0x01 ^ 0x02 ^ 0x03
      const buffer = Buffer.from([0x01, 0x02, 0x03, 0x00]);
      expect(parser.calculateChecksum(buffer)).toBe(0x01 ^ 0x02 ^ 0x03);
    });

    it('matches the checksum produced by buildFrame', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      // Last byte is the checksum written by buildFrame
      const storedChecksum = frame[frame.length - 1];
      // calculateChecksum should reproduce it
      expect(parser.calculateChecksum(frame)).toBe(storedChecksum);
    });

    it('returns 0 for a single-byte buffer', () => {
      // No bytes to XOR → 0
      expect(parser.calculateChecksum(Buffer.from([0x42]))).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // validate()
  // --------------------------------------------------------------------------

  describe('validate()', () => {
    it('accepts a correctly formed pressure frame', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      expect(parser.validate(frame)).toBe(true);
    });

    it('rejects a buffer shorter than MIN_LENGTH (6)', () => {
      expect(parser.validate(Buffer.from([0xff, 0xa1, 0x01, 0x00, 0x00]))).toBe(false);
    });

    it('rejects a buffer with wrong START byte', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      frame[0] = 0xfe; // corrupt start
      expect(parser.validate(frame)).toBe(false);
    });

    it('rejects a buffer where declared LENGTH does not match buffer size', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      frame[2] = 0x05; // lie about payload length
      expect(parser.validate(frame)).toBe(false);
    });

    it('rejects a frame with an unknown TYPE', () => {
      // 0xB1 = COMMAND — not a telemetry type
      const frame = buildFrame(0xb1, [0x00, 0x00]);
      expect(parser.validate(frame)).toBe(false);
    });

    it('rejects a frame with a bad checksum', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      frame[frame.length - 1] ^= 0xff; // flip all bits of checksum
      expect(parser.validate(frame)).toBe(false);
    });

    it('rejects an empty buffer', () => {
      expect(parser.validate(Buffer.alloc(0))).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // parse() — pressure
  // --------------------------------------------------------------------------

  describe('parse() — PRESSURE (0xA1)', () => {
    it('parses 20.0 cmH₂O correctly', () => {
      // raw = 20.0 × 10 = 200 = 0x00C8
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      const result = parser.parse(frame);

      expect(result).not.toBeNull();
      expect(result!.type).toBe(HexMessageType.PRESSURE);
      expect((result as any).pressure).toBeCloseTo(20.0);
      expect(result!.timestamp).toBe(1_700_000_000_000);
    });

    it('parses 0.0 cmH₂O (minimum boundary)', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0x00]);
      const result = parser.parse(frame);
      expect((result as any).pressure).toBeCloseTo(0.0);
    });

    it('parses 655.3 cmH₂O (max uint16 / 10)', () => {
      // raw = 0xFFFF = 65535 → 6553.5 cmH₂O
      const frame = buildFrame(HexMessageType.PRESSURE, [0xff, 0xff]);
      const result = parser.parse(frame);
      expect((result as any).pressure).toBeCloseTo(6553.5);
    });
  });

  // --------------------------------------------------------------------------
  // parse() — flow
  // --------------------------------------------------------------------------

  describe('parse() — FLOW (0xA2)', () => {
    it('parses positive flow 30.0 L/min', () => {
      // raw = 30.0 × 10 = 300 = 0x012C
      const frame = buildFrame(HexMessageType.FLOW, [0x01, 0x2c]);
      const result = parser.parse(frame);

      expect(result!.type).toBe(HexMessageType.FLOW);
      expect((result as any).flow).toBeCloseTo(30.0);
    });

    it('parses negative flow −5.0 L/min (expiratory)', () => {
      // raw = -50 as int16 BE = [0xFF, 0xCE]
      const raw = -50;
      const high = (raw >> 8) & 0xff;
      const low = raw & 0xff;
      const frame = buildFrame(HexMessageType.FLOW, [high, low]);
      const result = parser.parse(frame);

      expect((result as any).flow).toBeCloseTo(-5.0);
    });

    it('parses 0.0 L/min', () => {
      const frame = buildFrame(HexMessageType.FLOW, [0x00, 0x00]);
      expect((parser.parse(frame) as any).flow).toBeCloseTo(0.0);
    });
  });

  // --------------------------------------------------------------------------
  // parse() — volume
  // --------------------------------------------------------------------------

  describe('parse() — VOLUME (0xA3)', () => {
    it('parses 500 ml correctly', () => {
      // 500 = 0x01F4
      const frame = buildFrame(HexMessageType.VOLUME, [0x01, 0xf4]);
      const result = parser.parse(frame);

      expect(result!.type).toBe(HexMessageType.VOLUME);
      expect((result as any).volume).toBe(500);
    });

    it('parses 0 ml', () => {
      const frame = buildFrame(HexMessageType.VOLUME, [0x00, 0x00]);
      expect((parser.parse(frame) as any).volume).toBe(0);
    });

    it('parses maximum uint16 value (65535 ml)', () => {
      const frame = buildFrame(HexMessageType.VOLUME, [0xff, 0xff]);
      expect((parser.parse(frame) as any).volume).toBe(65535);
    });
  });

  // --------------------------------------------------------------------------
  // parse() — alarm
  // --------------------------------------------------------------------------

  describe('parse() — ALARM (0xA4)', () => {
    it('parses HIGH_PRESSURE / CRITICAL alarm', () => {
      // alarm_type = 0x01 (HIGH_PRESSURE), severity = 0x04 (CRITICAL)
      const frame = buildFrame(HexMessageType.ALARM, [0x01, 0x04]);
      const result = parser.parse(frame);

      expect(result!.type).toBe(HexMessageType.ALARM);
      expect((result as any).alarmType).toBe(AlarmType.HIGH_PRESSURE);
      expect((result as any).severity).toBe(AlarmSeverity.CRITICAL);
    });

    it('parses APNEA / HIGH alarm', () => {
      // alarm_type = 0x05 (APNEA), severity = 0x03 (HIGH)
      const frame = buildFrame(HexMessageType.ALARM, [0x05, 0x03]);
      const result = parser.parse(frame);

      expect((result as any).alarmType).toBe(AlarmType.APNEA);
      expect((result as any).severity).toBe(AlarmSeverity.HIGH);
    });

    it('parses DISCONNECTION / MEDIUM alarm', () => {
      const frame = buildFrame(HexMessageType.ALARM, [0x06, 0x02]);
      const result = parser.parse(frame);

      expect((result as any).alarmType).toBe(AlarmType.DISCONNECTION);
      expect((result as any).severity).toBe(AlarmSeverity.MEDIUM);
    });

    it('falls back to TECHNICAL_FAULT for unknown alarm type code', () => {
      const frame = buildFrame(HexMessageType.ALARM, [0xff, 0x01]);
      const result = parser.parse(frame);
      expect((result as any).alarmType).toBe(AlarmType.TECHNICAL_FAULT);
    });

    it('falls back to MEDIUM severity for unknown severity code', () => {
      const frame = buildFrame(HexMessageType.ALARM, [0x01, 0xff]);
      const result = parser.parse(frame);
      expect((result as any).severity).toBe(AlarmSeverity.MEDIUM);
    });
  });

  // --------------------------------------------------------------------------
  // parse() — invalid / null cases
  // --------------------------------------------------------------------------

  describe('parse() — invalid frames return null', () => {
    it('returns null for an empty buffer', () => {
      expect(parser.parse(Buffer.alloc(0))).toBeNull();
    });

    it('returns null for a buffer that is too short', () => {
      expect(parser.parse(Buffer.from([0xff, 0xa1, 0x01, 0x00]))).toBeNull();
    });

    it('returns null when START byte is wrong', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      frame[0] = 0x00;
      expect(parser.parse(frame)).toBeNull();
    });

    it('returns null for a corrupted checksum', () => {
      const frame = buildFrame(HexMessageType.PRESSURE, [0x00, 0xc8]);
      frame[frame.length - 1] ^= 0x01;
      expect(parser.parse(frame)).toBeNull();
    });

    it('returns null for an unknown TYPE (0xB1 = COMMAND)', () => {
      const frame = buildFrame(0xb1, [0x00, 0x00]);
      expect(parser.parse(frame)).toBeNull();
    });

    it('returns null when LENGTH field mismatches buffer size', () => {
      const frame = buildFrame(HexMessageType.VOLUME, [0x01, 0xf4]);
      frame[2] = 0x10; // claim 16 bytes of data when we only have 2
      expect(parser.parse(frame)).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // Timestamp
  // --------------------------------------------------------------------------

  describe('timestamp', () => {
    it('stamps each parsed result with Date.now()', () => {
      jest.spyOn(Date, 'now').mockReturnValue(9_999_999_999);
      const frame = buildFrame(HexMessageType.VOLUME, [0x00, 0x64]);
      expect(parser.parse(frame)!.timestamp).toBe(9_999_999_999);
    });
  });
});
