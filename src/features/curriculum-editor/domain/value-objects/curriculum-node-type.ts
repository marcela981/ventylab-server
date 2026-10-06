/*
 * Funcionalidad: Objeto de valor curriculum-node-type
 * Descripción: Define los valores permitidos CurriculumNodeTypeValue, LEVEL_CURRICULUM_NODE_TYPE, MODULE_CURRICULUM_NODE_TYPE, CURRICULUM_NODE_TYPE_VALUES de la feature de editor del currículo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export type CurriculumNodeTypeValue = "level" | "module";

export const LEVEL_CURRICULUM_NODE_TYPE: CurriculumNodeTypeValue = "level";
export const MODULE_CURRICULUM_NODE_TYPE: CurriculumNodeTypeValue = "module";

export const CURRICULUM_NODE_TYPE_VALUES: readonly CurriculumNodeTypeValue[] = [LEVEL_CURRICULUM_NODE_TYPE, MODULE_CURRICULUM_NODE_TYPE] as const;
