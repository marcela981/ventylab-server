// Tipos para servicios de evaluación

export interface ClinicalCaseData {
  id: string;
  title: string;
  description: string;
  patientAge: number;
  patientWeight: number;
  mainDiagnosis: string;
  comorbidities: string[];
  labData?: any;
  difficulty: string;
  pathology: string;
  educationalGoal: string;
  expertConfiguration?: ExpertConfigurationData;
}

export interface ExpertConfigurationData {
  id: string;
  ventilationMode: string;
  tidalVolume?: number;
  respiratoryRate?: number;
  peep?: number;
  fio2?: number;
  maxPressure?: number;
  iERatio?: string;
  justification: string;
  acceptableRanges?: Record<string, { min: number; max: number }>;
  parameterPriorities?: Record<string, string>;
}

export interface UserConfiguration {
  ventilationMode: string;
  tidalVolume?: number;
  respiratoryRate?: number;
  peep?: number;
  fio2?: number;
  maxPressure?: number;
  iERatio?: string;
}

export interface ParameterComparison {
  parameter: string;
  userValue: number | string | undefined;
  expertValue: number | string | undefined;
  difference: number | null;
  differencePercent: number | null;
  withinRange: boolean;
  errorClassification: 'correcto' | 'menor' | 'moderado' | 'critico';
  priority: string;
  acceptableRange?: { min: number; max: number };
}

export interface ConfigurationComparison {
  score: number; // 0-100
  totalParameters: number;
  correctParameters: number;
  parameters: ParameterComparison[];
  criticalErrors: string[]; // Nombres de parámetros con errores críticos
  summary: {
    correct: number;
    minor: number;
    moderate: number;
    critical: number;
  };
}

export interface EvaluationFeedback {
  feedback: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  safetyConcerns?: string[];
}

export interface EvaluationAttemptData {
  id: string;
  userId: string;
  clinicalCaseId: string;
  userConfiguration: UserConfiguration;
  score: number;
  differences: ConfigurationComparison;
  aiFeedback: string;
  completionTime?: number;
  isSuccessful: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface CaseSearchCriteria {
  difficulty?: string;
  pathology?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}
