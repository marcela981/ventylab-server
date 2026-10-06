/*
 * Funcionalidad: Usuario autenticado en las rutas de evaluaciones
 * Descripción: Forma mínima del usuario autenticado que entrega el decorador CurrentUser (sub, email, rol y permisos del JWT) y su conversión al ejecutor que usa la política de gestión de evaluaciones, sin depender de la capa de aplicación de auth
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type EvaluationActor } from "@/features/evaluation/domain/services/evaluation-management-policy";

export interface CurrentCaller {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

export function toEvaluationActor(caller: CurrentCaller): EvaluationActor {
  return { id: caller.sub, role: caller.role };
}
