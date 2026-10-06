/*
 * Funcionalidad: Adaptador BcryptPasswordHasher
 * Descripción: Implementa IPasswordHasher con bcrypt
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { IPasswordHasher } from "@/common/application/security/password-hasher.interface";

@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private static readonly SALT_ROUNDS: number = 10;

  public async hash(plainPassword: string): Promise<string> {
    return await bcrypt.hash(plainPassword, BcryptPasswordHasher.SALT_ROUNDS);
  }

  public async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
