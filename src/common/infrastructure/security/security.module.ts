/*
 * Funcionalidad: Módulo SecurityModule
 * Descripción: Módulo global que enlaza el puerto de hash de contraseñas con bcrypt
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Global, Module } from "@nestjs/common";

import { PASSWORD_HASHER_TOKEN } from "@/common/application/security/password-hasher.interface";
import { BcryptPasswordHasher } from "@/common/infrastructure/security/bcrypt-password-hasher";

@Global()
@Module({
  providers: [
    {
      provide: PASSWORD_HASHER_TOKEN,
      useClass: BcryptPasswordHasher,
    },
  ],
  exports: [PASSWORD_HASHER_TOKEN],
})
export class SecurityModule {}
