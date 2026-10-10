/*
 * Funcionalidad: Generador criptográfico de semillas de simulación
 * Descripción: Implementa ISimulationSeedGenerator con randomInt de node:crypto en el rango entero no negativo de 31 bits que admite la columna seed
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { randomInt } from "node:crypto";

import { Injectable } from "@nestjs/common";

import { type ISimulationSeedGenerator } from "@/features/simulation/application/ports/simulation-seed-generator.interface";

const MAX_SEED_EXCLUSIVE: number = 2 ** 31 - 1;

@Injectable()
export class CryptoSimulationSeedGenerator implements ISimulationSeedGenerator {
  public next(): number {
    return randomInt(0, MAX_SEED_EXCLUSIVE);
  }
}
