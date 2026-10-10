/*
 * Funcionalidad: Caso de uso ChangeClinicalCaseStatusUseCase
 * Descripción: Cambia el estado de un caso clínico (DRAFT, PUBLISHED, ARCHIVED) bajo bloqueo de fila, mantiene isActive sincronizado al persistir y audita el cambio; repetir el estado actual no escribe nada
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
import { ChangeClinicalCaseStatusCommand } from "@/features/clinical-cases/application/commands/change-clinical-case-status.command";
import { ClinicalCaseNotFoundError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { CLINICAL_CASE_AUDIT_TARGET, type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { type ClinicalCaseStatusValue } from "@/features/clinical-cases/domain/value-objects/clinical-case-status";

export const CLINICAL_CASE_STATUS_CHANGED_ACTION: string = "clinical_case_status_changed";

/**
 * @throws {ClinicalCaseNotFoundError} If the clinical case does not exist
 */
@Injectable()
export class ChangeClinicalCaseStatusUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: ChangeClinicalCaseStatusCommand): Promise<void> {
    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._clinicalCasesRepository.lockCase(command.caseId, transaction);

      const clinicalCase: ClinicalCase | undefined = await this._clinicalCasesRepository.getCaseById(command.caseId, transaction);

      if (!clinicalCase) {
        throw new ClinicalCaseNotFoundError();
      }

      const previousStatus: ClinicalCaseStatusValue = clinicalCase.status;

      if (!clinicalCase.changeStatus(command.status)) {
        return;
      }

      await this._clinicalCasesRepository.saveCase(clinicalCase, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        CLINICAL_CASE_STATUS_CHANGED_ACTION,
        CLINICAL_CASE_AUDIT_TARGET,
        clinicalCase.id,
        { status: previousStatus },
        { status: clinicalCase.status },
        transaction,
      );
    });
  }
}
