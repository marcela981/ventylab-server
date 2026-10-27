/*
 * Funcionalidad: Prueba de integración del sembrador de casos clínicos
 * Descripción: Suite de integración (npm run test:integration, PostgreSQL de Testcontainers con las migraciones aplicadas): el sembrador de arranque inserta los casos que faltan con sus signos vitales iniciales, dos arranques seguidos no cambian ninguna fila y un caso existente editado no se sobrescribe
 * Versión: 0.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ConfigService } from "@nestjs/config";
import { type ClinicalCase as ClinicalCaseRow } from "@prisma/client";

import { type IAuditLogRepository } from "@/common/domain/repositories/audit-log.repository";
import { type EnvironmentVariables } from "@/common/infrastructure/config/env.validation";
import { PrismaService } from "@/common/infrastructure/persistence/prisma/prisma.service";
import { EnsureSeedClinicalCasesUseCase } from "@/features/clinical-cases/application/use-cases/ensure-seed-clinical-cases.usecase";
import { BOOTSTRAP_CLINICAL_CASES, ClinicalCasesBootstrapService } from "@/features/clinical-cases/infrastructure/bootstrap/clinical-cases-bootstrap.service";
import { ClinicalCasesPrismaRepository } from "@/features/clinical-cases/infrastructure/persistence/prisma/repositories/clinical-cases-prisma.repository";

import { resetDatabase } from "../../../../../test/support/database";

describe("clinical cases bootstrap against PostgreSQL", () => {
  const config: ConfigService<EnvironmentVariables, true> = { get: (): string | undefined => process.env.DATABASE_URL } as unknown as ConfigService<EnvironmentVariables, true>;
  const db: PrismaService = new PrismaService(config);
  const auditLogRepository: IAuditLogRepository = { save: (): Promise<void> => Promise.resolve() };
  const bootstrap: ClinicalCasesBootstrapService = new ClinicalCasesBootstrapService(
    new EnsureSeedClinicalCasesUseCase(new ClinicalCasesPrismaRepository(db, auditLogRepository)),
  );

  beforeEach(async () => {
    await resetDatabase(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  function rowsById(): Promise<ClinicalCaseRow[]> {
    return db.clinicalCase.findMany({ orderBy: { id: "asc" } });
  }

  it("inserts the missing cases as published, not validated and with their initial vitals", async () => {
    await bootstrap.onApplicationBootstrap();

    const rows: ClinicalCaseRow[] = await rowsById();
    const ards: ClinicalCaseRow | undefined = rows.find((row: ClinicalCaseRow): boolean => row.id === "july-sdra-sepsis");

    expect(rows).toHaveLength(BOOTSTRAP_CLINICAL_CASES.length);
    expect(rows.every((row: ClinicalCaseRow): boolean => row.status === "PUBLISHED" && !row.validatedByExpert && row.isActive)).toBe(true);
    expect(ards?.initialVitals).toEqual({ heartRateBpm: 128, respiratoryRateBpm: 32, spo2Percent: 89, temperatureC: 38.8, systolicMmHg: 85, diastolicMmHg: 45, glasgow: 12 });
  });

  it("changes nothing on a second start", async () => {
    await bootstrap.onApplicationBootstrap();
    const first: ClinicalCaseRow[] = await rowsById();

    await bootstrap.onApplicationBootstrap();

    expect(await rowsById()).toEqual(first);
  });

  it("does not overwrite an existing case", async () => {
    await bootstrap.onApplicationBootstrap();
    await db.clinicalCase.update({ where: { id: "july-neumonia-grave" }, data: { title: "Editado por la docente", status: "ARCHIVED", isActive: false } });
    const edited: ClinicalCaseRow[] = await rowsById();

    await bootstrap.onApplicationBootstrap();

    expect(await rowsById()).toEqual(edited);
  });
});
