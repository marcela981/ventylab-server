/*
 * Funcionalidad: Puerto de repositorio MODULE_PROGRESS_REPOSITORY_TOKEN
 * Descripción: Define la interfaz IModuleProgressRepository y su token de inyección para la feature de módulos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ModuleProgressView, type ModuleResumeSnapshot } from "@/features/modules/domain/read-models/module-progress.read-model";

export const MODULE_PROGRESS_REPOSITORY_TOKEN: unique symbol = Symbol("MODULE_PROGRESS_REPOSITORY_TOKEN");

export interface IModuleProgressRepository {
  getProgressEnsuringRecord(userId: string, moduleId: string): Promise<ModuleProgressView | undefined>;
  getResumeSnapshot(userId: string, moduleId: string): Promise<ModuleResumeSnapshot | undefined>;
}
