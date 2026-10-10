/*
 * Funcionalidad: Caso de uso CreateClinicalCaseUseCase
 * Descripción: Crea un caso clínico en borrador (DRAFT, no validado, creado por el docente) tras validar su definición contra los rangos fisiológicos y audita la creación en la misma transacción
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
import { CreateClinicalCaseCommand } from "@/features/clinical-cases/application/commands/create-clinical-case.command";
import { CLINICAL_CASE_AUDIT_TARGET, ClinicalCase } from "@/features/clinical-cases/domain/entities/clinical-case.entity";
import {
  CLINICAL_CASES_REPOSITORY_TOKEN,
  type IClinicalCasesRepository,
} from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";

export const CLINICAL_CASE_CREATED_ACTION: string = "clinical_case_created";

/**
 * @throws {ClinicalCasePhysiologicalRangeError} If a value of the definition is outside its physiological range
 * @throws {InvalidClinicalCaseDefinitionError} If events, targets, settings or the rubric are inconsistent
 */
@Injectable()
export class CreateClinicalCaseUseCase {
  public constructor(
    @Inject(CLINICAL_CASES_REPOSITORY_TOKEN)
    private readonly _clinicalCasesRepository: IClinicalCasesRepository,
    @Inject(TRANSACTION_MANAGER_TOKEN)
    private readonly _transactionManager: ITransactionManager,
    @Inject(AUDIT_RECORDER_TOKEN)
    private readonly _auditRecorder: IAuditRecorder,
  ) {}

  public async execute(command: CreateClinicalCaseCommand): Promise<string> {
    const clinicalCase: ClinicalCase = ClinicalCase.create({ content: command.content, createdById: command.performedBy });

    await this._transactionManager.run(async (transaction: unknown): Promise<void> => {
      await this._clinicalCasesRepository.saveCase(clinicalCase, transaction);

      await this._auditRecorder.record(
        command.performedBy,
        CLINICAL_CASE_CREATED_ACTION,
        CLINICAL_CASE_AUDIT_TARGET,
        clinicalCase.id,
        {},
        clinicalCase.toAuditState(),
        transaction,
      );
    });

    return clinicalCase.id;
  }
}
