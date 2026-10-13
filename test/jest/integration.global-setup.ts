/*
 * Funcionalidad: globalSetup de la suite de integración
 * Descripción: Arranca una sola vez por ejecución el PostgreSQL de prueba con las migraciones aplicadas y publica su URL e identificador de ejecución en variables de entorno que leen los archivos de prueba
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { startTestInfrastructure } from "../support/containers";

export default async function integrationGlobalSetup(): Promise<void> {
  await startTestInfrastructure({ mqtt: false });
}
