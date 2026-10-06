/*
 * Funcionalidad: Mapper de configuración del paciente
 * Descripción: Convierte el DTO validado de configuración del paciente en la configuración de dominio que consume la fábrica de pacientes, tipando condición, sexo y dificultad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type PatientConfiguration } from "@/features/simulation/domain/services/patient-factory";
import {
  type GenderValue,
  type PatientConditionValue,
  type PatientDifficultyValue,
} from "@/features/simulation/domain/value-objects/patient-model";
import { type VentilatorCommand } from "@/features/simulation/domain/value-objects/ventilator-command";
import { type ConfigurePatientDTO } from "@/features/simulation/presentation/dtos/patient-request.dto";

export class PatientConfigurationMapper {
  public static toConfiguration(dto: ConfigurePatientDTO): PatientConfiguration {
    return {
      clinicalCaseId: dto.clinicalCaseId,
      demographics: dto.demographics
        ? {
          name: dto.demographics.name,
          weight: dto.demographics.weight,
          height: dto.demographics.height,
          age: dto.demographics.age,
          gender: dto.demographics.gender as GenderValue,
        }
        : undefined,
      condition: dto.condition as PatientConditionValue | undefined,
      vitalSigns: dto.vitalSigns
        ? {
          heartRate: dto.vitalSigns.heartRate,
          respiratoryRate: dto.vitalSigns.respiratoryRate,
          spo2: dto.vitalSigns.spo2,
          systolicBP: dto.vitalSigns.systolicBP,
          diastolicBP: dto.vitalSigns.diastolicBP,
          temperature: dto.vitalSigns.temperature,
        }
        : undefined,
      diagnosis: dto.diagnosis,
      difficultyLevel: dto.difficultyLevel as PatientDifficultyValue | undefined,
    };
  }

  public static toVentilatorCommand(command: Record<string, unknown>): VentilatorCommand {
    return command as unknown as VentilatorCommand;
  }
}
