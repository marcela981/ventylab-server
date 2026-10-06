/*
 * Funcionalidad: Comando SaveSimulatorSessionCommand
 * Descripción: Intención de guardar una sesión del simulador ya completada con su registro de parámetros y de lecturas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class SaveSimulatorSessionCommand {
  public readonly userId: string;
  public readonly isRealVentilator: boolean;
  public readonly parametersLog: unknown[];
  public readonly ventilatorData: unknown[];
  public readonly notes?: string;
  public readonly clinicalCaseId?: string;

  public constructor({
    userId,
    isRealVentilator,
    parametersLog,
    ventilatorData,
    notes,
    clinicalCaseId,
  }: {
    userId: string;
    isRealVentilator: boolean;
    parametersLog: unknown[];
    ventilatorData: unknown[];
    notes?: string;
    clinicalCaseId?: string;
  }) {
    this.userId = userId;
    this.isRealVentilator = isRealVentilator;
    this.parametersLog = parametersLog;
    this.ventilatorData = ventilatorData;
    this.notes = notes;
    this.clinicalCaseId = clinicalCaseId;
  }
}
