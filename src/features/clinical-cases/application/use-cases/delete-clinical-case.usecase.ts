/*
 * Funcionalidad: Caso de uso DeleteClinicalCaseUseCase
 * Descripción: Elimina un caso clínico bajo bloqueo de fila solo si no tiene sesiones de simulación (nuevas o heredadas), intentos de evaluación ni preguntas de evaluación que lo referencien; si está en uso sugiere archivarlo; audita la eliminación
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
import { DeleteClinicalCaseCommand } from "@/features/clinical-cases/application/commands/delete-clinical-case.command";
import { ClinicalCaseInUseError, ClinicalCaseNotFoundError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { CLINICAL_CASE_AUDIT_TARGET, type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import { type ClinicalCaseUsage } from "@/features/clinical-cases/domain/read-models/clinical-case.read-model";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";

export const CLINICAL_CASE_DELETED_ACTION: string = "clinical_case_deleted";

/**
 * @throws {ClinicalCaseNotFoundError} If the clinical case does not exist
 * @throws {ClinicalCaseInUseError} If simulation sessions, evaluation attempts or evaluation questions reference the case
 */
@Injectable()
export class DeleteClinicalCaseUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: DeleteClinicalCaseCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._clinicalCasesRepository.lockCase(command.caseId, transaction);

      const clinicalCase: ClinicalCase | undefined = await this._clinicalCasesRepository.getCaseById(command.caseId, transaction);

      if (!clinicalCase) {
        throw new ClinicalCaseNotFoundError();
      }

      const usage: ClinicalCaseUsage = await this._clinicalCasesRepository.getUsage(command.caseId, transaction);
      const references: number = usage.simulationSessions + usage.legacySimulatorSessions + usage.evaluationAttempts + usage.evaluationQuestions;

      if (references > 0) {
        throw new ClinicalCaseInUseError();
      }

      await this._clinicalCasesRepository.deleteCase(clinicalCase.id, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        CLINICAL_CASE_DELETED_ACTION,
        CLINICAL_CASE_AUDIT_TARGET,
        clinicalCase.id,
        clinicalCase.toAuditState(),
        {},
        transaction,
      );
    });
  }
}
