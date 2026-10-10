/*
 * Funcionalidad: Caso de uso UpdateClinicalCaseUseCase
 * Descripción: Reemplaza el contenido y la definición simulable de un caso clínico bajo bloqueo de fila, rechaza casos con sesiones de simulación (se deben duplicar), retira la validación por experto y audita el cambio
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type ITransactionManager, TRANSACTION_MANAGER_TOKEN } from "@/common/application/persistence/transaction-manager.interface";
import { AUDIT_RECORDER_TOKEN, type IAuditRecorder } from "@/common/application/ports/audit-recorder.interface";
import { UpdateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/update-clinical-case.command";
import { ClinicalCaseHasSimulationSessionsError, ClinicalCaseNotFoundError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { CLINICAL_CASE_AUDIT_TARGET, type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseUsage } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";

export const CLINICAL_CASE_UPDATED_ACTION: string = "clinical_case_updated";

/**
 * @throws {ClinicalCaseNotFoundError} If the clinical case does not exist
 * @throws {ClinicalCaseHasSimulationSessionsError} If simulation sessions already replay the current definition
 * @throws {ClinicalCasePhysiologicalRangeError} If a value of the definition is outside its physiological range
 * @throws {InvalidClinicalCaseDefinitionError} If events, targets, settings or the rubric are inconsistent
 */
@Injectable()
export class UpdateClinicalCaseUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: UpdateClinicalCaseCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._clinicalCasesRepository.lockCase(command.caseId, transaction);

      const clinicalCase: ClinicalCase | undefined = await this._clinicalCasesRepository.getCaseById(command.caseId, transaction);

      if (!clinicalCase) {
        throw new ClinicalCaseNotFoundError();
      }

      const usage: ClinicalCaseUsage = await this._clinicalCasesRepository.getUsage(command.caseId, transaction);

      if (usage.simulationSessions > 0) {
        throw new ClinicalCaseHasSimulationSessionsError();
      }

      const before: Record<string, unknown> = clinicalCase.toAuditState();

      clinicalCase.update(command.content);

      await this._clinicalCasesRepository.saveCase(clinicalCase, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        CLINICAL_CASE_UPDATED_ACTION,
        CLINICAL_CASE_AUDIT_TARGET,
        clinicalCase.id,
        before,
        clinicalCase.toAuditState(),
        transaction,
      );
    });
  }
}
