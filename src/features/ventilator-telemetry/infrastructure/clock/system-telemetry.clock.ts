/*
 * Funcionalidad: Reloj del sistema para la telemetría
 * Descripción: Implementa ITelemetryClock con Date.now para marcas de tiempo epoch y performance.now como reloj monótono para latencias
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { performance } from "perf_hooks";

import { Injectable } from "@nestjs/common";

import { type ITelemetryClock } from "@/features/ventilator-telemetry/application/ports/telemetry-clock.interface";

@Injectable()
export class SystemTelemetryClock implements ITelemetryClock {
  public now(): number {
    return Date.now();
  }

  public monotonic(): number {
    return performance.now();
  }
}
