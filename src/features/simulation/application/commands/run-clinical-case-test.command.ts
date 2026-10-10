/*
 * Funcionalidad: Comando RunClinicalCaseTestCommand
 * Descripción: Intención de probar un caso clínico en el motor sin intervención durante una cantidad de segundos simulados, con semilla opcional
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export class RunClinicalCaseTestCommand {
  public readonly caseId: string;
  public readonly seconds: number;
  public readonly seed?: number;

  public constructor({ caseId, seconds, seed }: { caseId: string; seconds: number; seed?: number }) {
    this.caseId = caseId;
    this.seconds = seconds;
    this.seed = seed;
  }
}
