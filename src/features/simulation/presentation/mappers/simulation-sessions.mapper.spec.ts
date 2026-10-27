/*
 * Funcionalidad: Pruebas del mapper de respuestas de sesiones de simulación
 * Descripción: Verifica que la vista del listado, el estado y la repetición lleven el formulario guardado del paciente propio sin sus ajustes internos, y patient null en una sesión sin paciente
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EngineCase } from "@/features/simulation/domain/engine";
import { SimulationSession } from "@/features/simulation/domain/entities/simulation-session.entity";
import { buildPatientOverrides, PATIENT_MAPPING_VERSION } from "@/features/simulation/domain/patient/patient-overrides";
import { type SimulatedPatient } from "@/features/simulation/domain/patient/simulated-patient";
import { SimulationSessionsResponseMapper } from "@/features/simulation/presentation/mappers/simulation-sessions.mapper";

const PATIENT: SimulatedPatient = {
  displayName: "Juan",
  ageYears: 60,
  sex: "MALE",
  weightKg: 70,
  heightCm: 175,
  condition: "PNEUMONIA",
  difficulty: "INTERMEDIATE",
  allergies: ["Penicilina"],
  history: ["HTA"],
  vitals: { respiratoryRateBpm: 24, spo2Percent: 84, heartRateBpm: 105 },
};

function session(withPatient: boolean): SimulationSession {
  return SimulationSession.start({
    userId: "student-1",
    caseId: "july-neumonia-grave",
    mode: "FREE",
    seed: 1,
    engineVersion: "1.0.0",
    timeMultiplier: 1,
    patientProfile: withPatient
      ? { form: PATIENT, overrides: buildPatientOverrides({ id: "july-neumonia-grave" }, PATIENT), mappingVersion: PATIENT_MAPPING_VERSION }
      : undefined,
    now: new Date("2026-10-26T12:00:00Z"),
  });
}

describe("SimulationSessionsResponseMapper patient", () => {
  it("exposes the stored form, not the overrides, in the list, the state and the replay", () => {
    const withPatient: SimulationSession = session(true);
    const list: unknown = JSON.parse(JSON.stringify(SimulationSessionsResponseMapper.toSessionDTO(withPatient).patient));
    const state: unknown = JSON.parse(
      JSON.stringify(
        SimulationSessionsResponseMapper.toStateDTO({ session: withPatient, simTimeMs: 0, settings: {} as never, metrics: {} as never, alarms: [], targets: [] }).patient,
      ),
    );
    const replay: unknown = JSON.parse(
      JSON.stringify(
        SimulationSessionsResponseMapper.toReplayDTO(
          { session: withPatient, engineCase: {} as EngineCase, events: [], currentEngineVersion: "1.0.0", engineVersionMismatch: false },
          null,
        ).patient,
      ),
    );

    expect(list).toEqual(PATIENT);
    expect(state).toEqual(PATIENT);
    expect(replay).toEqual(PATIENT);
    expect(JSON.stringify(list)).not.toContain("complianceMlPerCmH2O");
  });

  it("returns null without an own patient", () => {
    expect(SimulationSessionsResponseMapper.toSessionDTO(session(false)).patient).toBeNull();
  });
});
