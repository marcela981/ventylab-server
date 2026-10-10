/*
 * Funcionalidad: Módulo ClinicalCasesModule
 * Descripción: Registra la feature de casos clínicos (controlador, casos de uso de consulta, evaluación y gestión docente, generador de retroalimentación sobre el gateway de IA de AiModule, repositorio Prisma) y exporta ClinicalCasesFacade
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Module } from "@nestjs/common";

import { AiModule } from "@/features/ai/ai.module";
import { AuthModule } from "@/features/auth/auth.module";
import { ClinicalCasesFacade } from "@/features/clinical-cases/application/services/clinical-cases.facade";
import { EvaluationFeedbackGenerator } from "@/features/clinical-cases/application/services/evaluation-feedback-generator.service";
import { ChangeClinicalCaseStatusUseCase } from "@/features/clinical-cases/application/use-cases/change-clinical-case-status.usecase";
import { CreateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/create-clinical-case.usecase";
import { DeleteClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/delete-clinical-case.usecase";
import { DuplicateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/duplicate-clinical-case.usecase";
import { EvaluateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/evaluate-clinical-case.usecase";
import { GetClinicalCaseAttemptsUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case-attempts.usecase";
import { GetClinicalCaseDefinitionUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case-definition.usecase";
import { GetClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-case.usecase";
import { GetClinicalCasesUseCase } from "@/features/clinical-cases/application/use-cases/get-clinical-cases.usecase";
import { UpdateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/update-clinical-case.usecase";
import { ValidateClinicalCaseUseCase } from "@/features/clinical-cases/application/use-cases/validate-clinical-case.usecase";
import { CLINICAL_CASES_REPOSITORY_TOKEN } from "@/features/clinical-cases/domain/repositories/clinical-cases.repository";
import { ClinicalCasesPrismaRepository } from "@/features/clinical-cases/infrastructure/persistence/prisma/repositories/clinical-cases-prisma.repository";
import { ClinicalCasesController } from "@/features/clinical-cases/presentation/controllers/clinical-cases.controller";

@Module({
  imports: [AuthModule, AiModule],
  controllers: [ClinicalCasesController],
  providers: [
    {
      provide: CLINICAL_CASES_REPOSITORY_TOKEN,
      useClass: ClinicalCasesPrismaRepository,
    },
    EvaluationFeedbackGenerator,
    GetClinicalCasesUseCase,
    GetClinicalCaseUseCase,
    EvaluateClinicalCaseUseCase,
    GetClinicalCaseAttemptsUseCase,
    GetClinicalCaseDefinitionUseCase,
    CreateClinicalCaseUseCase,
    UpdateClinicalCaseUseCase,
    ChangeClinicalCaseStatusUseCase,
    DuplicateClinicalCaseUseCase,
    ValidateClinicalCaseUseCase,
    DeleteClinicalCaseUseCase,
    ClinicalCasesFacade,
  ],
  exports: [CLINICAL_CASES_REPOSITORY_TOKEN, EvaluationFeedbackGenerator, ClinicalCasesFacade],
})
export class ClinicalCasesModule {}
