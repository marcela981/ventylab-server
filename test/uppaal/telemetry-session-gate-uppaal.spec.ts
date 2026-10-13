/*
 * Funcionalidad: Propiedad S4 del modelo UPPAAL de telemetría como prueba ejecutable
 * Descripción: Mide con el reloj real la verificación de sesión que el backend hace antes de entregar telemetría (JwtAccessTokenVerifier sobre JwtTokenGenerator y la decisión de VentilatorRoomAccessService.handleJoinRequest) y comprueba que su p99 no supera los 5 ms de apiGateway.t_gate; las reservas y el publicador en tiempo real son dobles de prueba
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

import { type AccessTokenClaims } from "@/common/application/ports/access-token-verifier.interface";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { JwtAccessTokenVerifier } from "@/features/auth/infrastructure/jwt/jwt-access-token-verifier";
import { JwtTokenGenerator } from "@/features/auth/infrastructure/jwt/jwt-token-generator";
import { type ActiveReservationSummary } from "@/features/reservations/application/results/active-reservation-summary.result";
import { type ReservationsFacade } from "@/features/reservations/application/services/reservations.facade";
import { VentilatorRoomAccessService, type VentilatorJoinOutcome } from "@/features/ventilator-telemetry/application/services/ventilator-room-access.service";
import { buildTelemetrySettings, FakeRealtimePublisher } from "@/features/ventilator-telemetry/application/testing/ventilator-telemetry-test-doubles-spec";

const MODEL_GATE_BUDGET_MS: number = 5;
const SAMPLES: number = 500;
const WARM_UP: number = 50;

class FakeReservationsFacade {
  public async getActiveReservation(_now: Date): Promise<ActiveReservationSummary | undefined> {
    return await Promise.resolve({
      id: "reservation-1",
      holderType: "GROUP",
      groupId: "group-1",
      createdById: "teacher-1",
      startsAt: new Date("2026-10-13T10:00:00.000Z"),
      endsAt: new Date("2026-10-13T11:00:00.000Z"),
    });
  }

  public async listHolderUserIds(_reservation: ActiveReservationSummary): Promise<string[]> {
    return await Promise.resolve(["student-1"]);
  }
}

function percentile(values: number[], fraction: number): number {
  const sorted: number[] = [...values].sort((left: number, right: number): number => left - right);

  return sorted[Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)];
}

function buildVerifier(): { verifier: JwtAccessTokenVerifier; generator: JwtTokenGenerator } {
  const jwtService: JwtService = new JwtService({ secret: "uppaal-access-secret", signOptions: { expiresIn: 900 } });
  const configService: ConfigService<EnvironmentVariables, true> = { get: (): undefined => undefined } as unknown as ConfigService<EnvironmentVariables, true>;
  const generator: JwtTokenGenerator = new JwtTokenGenerator(jwtService, configService);

  return { verifier: new JwtAccessTokenVerifier(generator), generator };
}

describe("UPPAAL telemetry model (ventilab-uppaal.xml, corrected-v2) S4 as an executable property", () => {
  describe("S4 A[] apiGateway.CHECKING_SESSION imply apiGateway.t_gate <= 5", () => {
    it("keeps the p99 of the socket session check (JWT verification plus the room join decision) at or below 5 ms with the real clock", async () => {
      const { verifier, generator } = buildVerifier();
      const room: VentilatorRoomAccessService = new VentilatorRoomAccessService(
        new FakeReservationsFacade() as unknown as ReservationsFacade,
        new FakeRealtimePublisher(),
        buildTelemetrySettings(),
      );
      const validToken: string = await generator.generateToken({ sub: "student-1", email: "s1@ventylab.com", role: "STUDENT", permissions: [] });
      const forgedToken: string = `${validToken.slice(0, -4)}AAAA`;
      const durations: number[] = [];
      const outcomes: Set<VentilatorJoinOutcome> = new Set<VentilatorJoinOutcome>();

      await room.refresh();

      for (let index: number = 0; index < SAMPLES + WARM_UP; index += 1) {
        const token: string = index % 2 === 0 ? validToken : forgedToken;
        const startedAt: number = performance.now();
        const claims: AccessTokenClaims | undefined = await verifier.verify(token);
        const outcome: VentilatorJoinOutcome | undefined = claims === undefined ? undefined : room.handleJoinRequest({ userId: claims.sub, role: claims.role });
        const elapsed: number = performance.now() - startedAt;

        if (index >= WARM_UP) {
          durations.push(elapsed);
        }

        if (outcome !== undefined) {
          outcomes.add(outcome);
        }
      }

      expect(outcomes).toEqual(new Set<VentilatorJoinOutcome>(["joined"]));
      expect(await verifier.verify(forgedToken)).toBeUndefined();
      expect(percentile(durations, 0.99)).toBeLessThanOrEqual(MODEL_GATE_BUDGET_MS);
    });
  });
});
