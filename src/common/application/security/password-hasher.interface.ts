/*
 * Funcionalidad: Puerto IPasswordHasher
 * Descripción: Define el contrato para generar y comparar hashes de contraseñas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export const PASSWORD_HASHER_TOKEN: unique symbol = Symbol("PASSWORD_HASHER_TOKEN");

export interface IPasswordHasher {
  hash(plainPassword: string): Promise<string>;
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
