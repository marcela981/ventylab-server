/**
 * @file hex-encoder.test.ts
 * @description Unit tests for HexEncoder.
 *
 * Frame layout (mandatory 6-byte payload):
 *   [0xFF] [0xB1] [LEN] [MODE] [TV_HI] [TV_LO] [RR] [PEEP] [FIO2] [CHECKSUM]
 *    idx 0   1     2     3      4       5       6    7     8        last
 *
 * Optional bytes are appended before the checksum:
 *   pressureLimit  → 1 byte  at idx 9
 *   inspiratoryTime → 2 bytes at idx 9 (or 10 if pressureLimit present)
 *
 * Checksum = XOR of all bytes from index 0 to (N-2) inclusive.
 */

import { HexEncoder } from '../hex-encoder';
import { VentilationMode } from '../../../../contracts/simulation.contracts';
import type { VentilatorCommand } from '../../../../contracts/simulation.contracts';

// ============================================================================
// Helpers
// ============================================================================

/** Recomputes the XOR checksum of a frame to independently verify it. */
function computeChecksum(frame: Buffer): number {
  let cs = 0;
  for (let i = 0; i < frame.length - 1; i++) cs ^= frame[i];
  return cs;
}

/** Minimal valid VCV command with no optional fields. */
function makeCommand(overrides: Partial<VentilatorCommand> = {}): VentilatorCommand {
  return {
    mode: VentilationMode.VCV,
    tidalVolume: 500,
    respiratoryRate: 14,
    peep: 5,
    fio2: 0.4,
    timestamp: 0,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('HexEncoder', () => {
  let encoder: HexEncoder;

  beforeEach(() => {
    encoder = new HexEncoder();
  });

  // --------------------------------------------------------------------------
  // validateCommand()
  // --------------------------------------------------------------------------

  describe('validateCommand()', () => {
    it('returns true for a valid command', () => {
      expect(encoder.validateCommand(makeCommand())).toBe(true);
    });

    it('returns false when tidalVolume is below 200', () => {
      expect(encoder.validateCommand(makeCommand({ tidalVolume: 199 }))).toBe(false);
    });

    it('returns false when tidalVolume is above 800', () => {
      expect(encoder.validateCommand(makeCommand({ tidalVolume: 801 }))).toBe(false);
    });

    it('returns false when respiratoryRate is below 5', () => {
      expect(encoder.validateCommand(makeCommand({ respiratoryRate: 4 }))).toBe(false);
    });

    it('returns false when respiratoryRate is above 40', () => {
      expect(encoder.validateCommand(makeCommand({ respiratoryRate: 41 }))).toBe(false);
    });

    it('returns false when peep is above 20', () => {
      expect(encoder.validateCommand(makeCommand({ peep: 21 }))).toBe(false);
    });

    it('returns true when peep is 0 (boundary minimum)', () => {
      expect(encoder.validateCommand(makeCommand({ peep: 0 }))).toBe(true);
    });

    it('returns false when fio2 is below 0.21', () => {
      expect(encoder.validateCommand(makeCommand({ fio2: 0.20 }))).toBe(false);
    });

    it('returns false when fio2 is above 1.0', () => {
      expect(encoder.validateCommand(makeCommand({ fio2: 1.01 }))).toBe(false);
    });

    it('returns false when optional pressureLimit is out of range', () => {
      expect(
        encoder.validateCommand(makeCommand({ pressureLimit: 9 })),
      ).toBe(false);
      expect(
        encoder.validateCommand(makeCommand({ pressureLimit: 51 })),
      ).toBe(false);
    });

    it('returns true when optional pressureLimit is within range', () => {
      expect(encoder.validateCommand(makeCommand({ pressureLimit: 30 }))).toBe(true);
    });

    it('returns false when optional inspiratoryTime is out of range', () => {
      expect(
        encoder.validateCommand(makeCommand({ inspiratoryTime: 0.4 })),
      ).toBe(false);
      expect(
        encoder.validateCommand(makeCommand({ inspiratoryTime: 3.1 })),
      ).toBe(false);
    });

    it('returns true when optional inspiratoryTime is within range', () => {
      expect(encoder.validateCommand(makeCommand({ inspiratoryTime: 1.5 }))).toBe(true);
    });

    it('ignores absent optional fields (no false positives)', () => {
      // Undefined pressureLimit / inspiratoryTime must not trigger errors
      const cmd = makeCommand();
      expect(cmd.pressureLimit).toBeUndefined();
      expect(cmd.inspiratoryTime).toBeUndefined();
      expect(encoder.validateCommand(cmd)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // getValidationErrors()
  // --------------------------------------------------------------------------

  describe('getValidationErrors()', () => {
    it('returns an empty array for a valid command', () => {
      expect(encoder.getValidationErrors(makeCommand())).toEqual([]);
    });

    it('returns one error per out-of-range field', () => {
      const errors = encoder.getValidationErrors(
        makeCommand({ tidalVolume: 100, respiratoryRate: 2 }),
      );
      expect(errors).toHaveLength(2);
      expect(errors[0]).toMatch(/tidalVolume/);
      expect(errors[1]).toMatch(/respiratoryRate/);
    });

    it('error messages mention the received value', () => {
      const errors = encoder.getValidationErrors(makeCommand({ peep: 25 }));
      expect(errors[0]).toContain('25');
    });

    it('error messages mention the allowed range', () => {
      const errors = encoder.getValidationErrors(makeCommand({ fio2: 0.1 }));
      expect(errors[0]).toMatch(/0\.21/);
      expect(errors[0]).toMatch(/1/);
    });

    it('includes pressureLimit error when out of range', () => {
      const errors = encoder.getValidationErrors(makeCommand({ pressureLimit: 5 }));
      expect(errors.some((e) => e.includes('pressureLimit'))).toBe(true);
    });

    it('does not include pressureLimit error when field is absent', () => {
      const errors = encoder.getValidationErrors(makeCommand());
      expect(errors.every((e) => !e.includes('pressureLimit'))).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // encode() — frame structure
  // --------------------------------------------------------------------------

  describe('encode() — frame structure', () => {
    it('starts with START byte 0xFF', () => {
      const frame = encoder.encode(makeCommand());
      expect(frame[0]).toBe(0xff);
    });

    it('has TYPE byte 0xB1 (COMMAND)', () => {
      const frame = encoder.encode(makeCommand());
      expect(frame[1]).toBe(0xb1);
    });

    it('LENGTH byte equals number of data bytes (6 for mandatory-only frame)', () => {
      const frame = encoder.encode(makeCommand());
      expect(frame[2]).toBe(6);
    });

    it('total frame length is header(3) + data + checksum(1)', () => {
      const frame = encoder.encode(makeCommand());
      // 3 header + 6 data + 1 checksum = 10
      expect(frame.length).toBe(10);
    });

    it('checksum byte equals XOR of all preceding bytes', () => {
      const frame = encoder.encode(makeCommand());
      expect(frame[frame.length - 1]).toBe(computeChecksum(frame));
    });
  });

  // --------------------------------------------------------------------------
  // encode() — mandatory data bytes
  // --------------------------------------------------------------------------

  describe('encode() — data bytes (mandatory fields)', () => {
    it('encodes VCV mode as 0x01 at byte index 3', () => {
      expect(encoder.encode(makeCommand({ mode: VentilationMode.VCV }))[3]).toBe(0x01);
    });

    it('encodes PCV mode as 0x02', () => {
      expect(encoder.encode(makeCommand({ mode: VentilationMode.PCV }))[3]).toBe(0x02);
    });

    it('encodes SIMV mode as 0x03', () => {
      expect(encoder.encode(makeCommand({ mode: VentilationMode.SIMV }))[3]).toBe(0x03);
    });

    it('encodes PSV mode as 0x04', () => {
      expect(encoder.encode(makeCommand({ mode: VentilationMode.PSV }))[3]).toBe(0x04);
    });

    it('encodes tidalVolume 500 as [0x01, 0xF4] at bytes 4-5', () => {
      const frame = encoder.encode(makeCommand({ tidalVolume: 500 }));
      // 500 = 0x01F4
      expect(frame[4]).toBe(0x01);
      expect(frame[5]).toBe(0xf4);
    });

    it('encodes tidalVolume 200 (minimum) correctly', () => {
      const frame = encoder.encode(makeCommand({ tidalVolume: 200 }));
      // 200 = 0x00C8
      expect(frame[4]).toBe(0x00);
      expect(frame[5]).toBe(0xc8);
    });

    it('encodes respiratoryRate at byte index 6', () => {
      const frame = encoder.encode(makeCommand({ respiratoryRate: 14 }));
      expect(frame[6]).toBe(14);
    });

    it('encodes peep at byte index 7', () => {
      const frame = encoder.encode(makeCommand({ peep: 5 }));
      expect(frame[7]).toBe(5);
    });

    it('encodes fio2 as integer percentage at byte index 8 (0.40 → 40)', () => {
      const frame = encoder.encode(makeCommand({ fio2: 0.4 }));
      expect(frame[8]).toBe(40);
    });

    it('encodes fio2 1.0 as 100', () => {
      const frame = encoder.encode(makeCommand({ fio2: 1.0 }));
      expect(frame[8]).toBe(100);
    });

    it('encodes fio2 0.21 as 21', () => {
      const frame = encoder.encode(makeCommand({ fio2: 0.21 }));
      expect(frame[8]).toBe(21);
    });
  });

  // --------------------------------------------------------------------------
  // encode() — optional fields
  // --------------------------------------------------------------------------

  describe('encode() — optional fields', () => {
    it('appends pressureLimit as 1 byte after mandatory data', () => {
      const frame = encoder.encode(makeCommand({ pressureLimit: 30 }));
      // frame = [0xFF, 0xB1, LEN=7, MODE, TV_HI, TV_LO, RR, PEEP, FIO2, PLIM, CS]
      expect(frame.length).toBe(11);
      expect(frame[2]).toBe(7);   // LENGTH
      expect(frame[9]).toBe(30);  // pressureLimit
    });

    it('appends inspiratoryTime as uint16 BE × 10 after mandatory data', () => {
      // 1.5 s → 15 → 0x000F
      const frame = encoder.encode(makeCommand({ inspiratoryTime: 1.5 }));
      expect(frame.length).toBe(12);
      expect(frame[2]).toBe(8);    // LENGTH
      expect(frame[9]).toBe(0x00); // IT_HI
      expect(frame[10]).toBe(0x0f); // IT_LO
    });

    it('appends both pressureLimit and inspiratoryTime when both present', () => {
      const frame = encoder.encode(
        makeCommand({ pressureLimit: 30, inspiratoryTime: 1.0 }),
      );
      // data = 6 mandatory + 1 pressureLimit + 2 inspiratoryTime = 9
      expect(frame.length).toBe(13);
      expect(frame[2]).toBe(9);    // LENGTH
      expect(frame[9]).toBe(30);   // pressureLimit
      expect(frame[10]).toBe(0x00); // IT_HI
      expect(frame[11]).toBe(0x0a); // IT_LO (1.0 × 10 = 10 = 0x0A)
    });

    it('checksum is correct regardless of which optional fields are present', () => {
      const f1 = encoder.encode(makeCommand({ pressureLimit: 20, inspiratoryTime: 2.0 }));
      expect(f1[f1.length - 1]).toBe(computeChecksum(f1));
    });
  });

  // --------------------------------------------------------------------------
  // encode() — error handling
  // --------------------------------------------------------------------------

  describe('encode() — invalid command throws', () => {
    it('throws RangeError for a command with out-of-range tidalVolume', () => {
      expect(() => encoder.encode(makeCommand({ tidalVolume: 900 }))).toThrow(
        RangeError,
      );
    });

    it('error message lists the offending field', () => {
      expect(() =>
        encoder.encode(makeCommand({ respiratoryRate: 50 })),
      ).toThrow(/respiratoryRate/);
    });
  });

  // --------------------------------------------------------------------------
  // encode() — round-trip byte verification
  // --------------------------------------------------------------------------

  describe('encode() — full frame round-trip', () => {
    it('produces a deterministic, byte-exact frame for a known command', () => {
      const cmd = makeCommand({
        mode: VentilationMode.VCV,
        tidalVolume: 500,  // 0x01F4
        respiratoryRate: 14, // 0x0E
        peep: 5,           // 0x05
        fio2: 0.4,         // → 40 = 0x28
      });
      const frame = encoder.encode(cmd);

      // Build expected manually for documentation/regression purposes
      const expectedWithoutCs = Buffer.from([
        0xff, // START
        0xb1, // TYPE (COMMAND)
        0x06, // LENGTH (6 mandatory data bytes)
        0x01, // MODE (VCV)
        0x01, 0xf4, // tidalVolume 500
        0x0e, // respiratoryRate 14
        0x05, // peep 5
        0x28, // fio2 40 (= 0.4 × 100)
      ]);
      const expectedCs = computeChecksum(
        Buffer.concat([expectedWithoutCs, Buffer.from([0x00])]),
      );
      // Note: computeChecksum ignores the last byte, so appending 0x00 is harmless

      expect(frame.subarray(0, 9)).toEqual(expectedWithoutCs);
      expect(frame[9]).toBe(expectedCs);
    });
  });
});
