/*
 * Funcionalidad: Datos personales del usuario para el tutor
 * Descripción: Implementa ITutorPersonalData con UsersFacade: entrega el nombre completo del usuario y cada nombre o apellido de al menos tres caracteres para eliminarlos del texto que se envía a los proveedores de IA
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { type ITutorPersonalData } from "@/features/ai-tutor/application/ports/tutor-personal-data.interface";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

const MIN_NAME_TOKEN_LENGTH: number = 3;

@Injectable()
export class UsersTutorPersonalData implements ITutorPersonalData {
  public constructor(private readonly _usersFacade: UsersFacade) {}

  // The guard matches whole words only, so given names and surnames can be redacted without touching longer words; tokens under three characters ("de", "la") are skipped.
  public async getRedactableNames(userId: string): Promise<string[]> {
    const user: UserAccount | undefined = await this._usersFacade.getUserById(userId);
    const fullName: string = (user?.name ?? "").trim().split(/\s+/u).filter((token: string) => token.length > 0).join(" ");

    if (fullName.length === 0) {
      return [];
    }

    const tokens: string[] = fullName.split(" ").filter((token: string) => token.length >= MIN_NAME_TOKEN_LENGTH && token !== fullName);

    return [...new Set([fullName, ...tokens])];
  }
}
