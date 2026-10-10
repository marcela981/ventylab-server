/*
 * Funcionalidad: Caso de uso DuplicateClinicalCaseUseCase
 * Descripción: Copia un caso clínico como borrador nuevo (DRAFT, sin validación por experto, creado por quien duplica) con un sufijo en el título y audita la copia indicando el caso de origen
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
import { DuplicateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/duplicate-clinical-case.command";
import { ClinicalCaseNotFoundError } from "@/features/clinical-cases/domain/clinical-cases.errors";
import { CLINICAL_CASE_AUDIT_TARGET, type ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";

export const CLINICAL_CASE_DUPLICATED_ACTION: string = "clinical_case_duplicated";

/**
 * @throws {ClinicalCaseNotFoundError} If the source clinical case does not exist
 */
@Injectable()
export class DuplicateClinicalCaseUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: DuplicateClinicalCaseCommand): Promise<string> {
    return await this._transactionManager.run(async (transaction: unknown): Promise<string> => {
      const source: ClinicalCase | undefined = await this._clinicalCasesRepository.getCaseById(command.caseId, transaction);

      if (!source) {
        throw new ClinicalCaseNotFoundError();
      }

      const copy: ClinicalCase = source.duplicate({ createdById: command.performedBy, titleSuffix: command.titleSuffix });

      await this._clinicalCasesRepository.saveCase(copy, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        CLINICAL_CASE_DUPLICATED_ACTION,
        CLINICAL_CASE_AUDIT_TARGET,
        copy.id,
        { sourceCaseId: source.id },
        copy.toAuditState(),
        transaction,
      );

      return copy.id;
    });
  }
}
