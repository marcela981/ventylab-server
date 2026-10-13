/*
 * Funcionalidad: globalTeardown de las suites con contenedores
 * Descripción: Detiene y elimina los contenedores de PostgreSQL y Mosquitto arrancados por el globalSetup de la ejecución
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { stopTestInfrastructure } from "../support/containers";

export default async function globalTeardown(): Promise<void> {
  await stopTestInfrastructure();
}
