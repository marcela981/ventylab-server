/*
 * Funcionalidad: Entidad ClinicalCase
 * Descripción: Caso clínico editable por docentes: contenido clínico, definición simulable validada contra rangos fisiológicos, estado (DRAFT, PUBLISHED, ARCHIVED) como fuente de verdad de la visibilidad, duplicado como borrador y validación por experto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { generateId } from "@/common/domain/utils/generate-id";
import {
  type ClinicalCaseHistory,
  type ClinicalCaseSimulationProfile,
} from "@/features/clinical-cases/domain/read-models/clinical-case-simulation.read-model";
import { assertValidClinicalCaseDefinition } from "@/features/clinical-cases/domain/services/clinical-case-definition-validator";
import { type CaseDifficultyValue } from "@/features/clinical-cases/domain/value-objects/case-difficulty";
import {
  type ClinicalCaseStatusValue,
  DRAFT_STATUS_VALUE,
  isLegacyActiveStatus,
  PUBLISHED_STATUS_VALUE,
} from "@/features/clinical-cases/domain/value-objects/clinical-case-status";
import { type PathologyValue } from "@/features/clinical-cases/domain/value-objects/pathology";

export const CLINICAL_CASE_AUDIT_TARGET: string = "ClinicalCase";

export interface ClinicalCaseContent {
  readonly title: string;
  readonly description: string;
  readonly summary?: string;
  readonly history?: ClinicalCaseHistory;
  readonly patientAge: number;
  readonly patientWeight: number;
  readonly mainDiagnosis: string;
  readonly comorbidities: readonly string[];
  readonly labData?: unknown;
  readonly difficulty: CaseDifficultyValue;
  readonly pathology: PathologyValue;
  readonly educationalGoal: string;
  readonly simulation: ClinicalCaseSimulationProfile;
}

export interface ClinicalCaseProps {
  readonly id: string;
  readonly content: ClinicalCaseContent;
  readonly status: ClinicalCaseStatusValue;
  readonly validatedByExpert: boolean;
  readonly validatedById?: string;
  readonly createdById?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ClinicalCase {
  private readonly _id: string;
  private _content: ClinicalCaseContent;
  private _status: ClinicalCaseStatusValue;
  private _validatedByExpert: boolean;
  private _validatedById?: string;
  private readonly _createdById?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ClinicalCaseProps) {
    this._id = props.id;
    this._content = props.content;
    this._status = props.status;
    this._validatedByExpert = props.validatedByExpert;
    this._validatedById = props.validatedById;
    this._createdById = props.createdById;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public get id(): string {
    return this._id;
  }

  public get content(): ClinicalCaseContent {
    return this._content;
  }

  public get status(): ClinicalCaseStatusValue {
    return this._status;
  }

  public get isActive(): boolean {
    return isLegacyActiveStatus(this._status);
  }

  public get isPublished(): boolean {
    return this._status === PUBLISHED_STATUS_VALUE;
  }

  public get validatedByExpert(): boolean {
    return this._validatedByExpert;
  }

  public get validatedById(): string | undefined {
    return this._validatedById;
  }

  public get createdById(): string | undefined {
    return this._createdById;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get isSimulationReady(): boolean {
    const simulation: ClinicalCaseSimulationProfile = this._content.simulation;

    return (
      simulation.mechanics !== undefined &&
      simulation.initialVentilatorSettings !== undefined &&
      simulation.initialState !== undefined &&
      simulation.patientSex !== undefined &&
      simulation.patientHeightCm !== undefined
    );
  }

  public static create({ content, createdById }: { content: ClinicalCaseContent; createdById: string }): ClinicalCase {
    assertValidClinicalCaseDefinition(content);

    const now: Date = new Date();

    return new ClinicalCase({
      id: generateId(),
      content,
      status: DRAFT_STATUS_VALUE,
      validatedByExpert: false,
      validatedById: undefined,
      createdById,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(props: ClinicalCaseProps): ClinicalCase {
    return new ClinicalCase(props);
  }

  public update(content: ClinicalCaseContent): void {
    assertValidClinicalCaseDefinition(content);

    this._content = content;
    this._validatedByExpert = false;
    this._validatedById = undefined;
    this._updatedAt = new Date();
  }

  public changeStatus(status: ClinicalCaseStatusValue): boolean {
    if (this._status === status) {
      return false;
    }

    this._status = status;
    this._updatedAt = new Date();

    return true;
  }

  public markValidatedByExpert(validatorId: string): void {
    this._validatedByExpert = true;
    this._validatedById = validatorId;
    this._updatedAt = new Date();
  }

  public duplicate({ createdById, titleSuffix }: { createdById: string; titleSuffix: string }): ClinicalCase {
    const now: Date = new Date();

    return new ClinicalCase({
      id: generateId(),
      content: { ...this._content, title: `${this._content.title}${titleSuffix}` },
      status: DRAFT_STATUS_VALUE,
      validatedByExpert: false,
      validatedById: undefined,
      createdById,
      createdAt: now,
      updatedAt: now,
    });
  }

  public toAuditState(): Record<string, unknown> {
    return {
      title: this._content.title,
      status: this._status,
      validatedByExpert: this._validatedByExpert,
      validatedById: this._validatedById ?? null,
      simulationReady: this.isSimulationReady,
    };
  }
}
