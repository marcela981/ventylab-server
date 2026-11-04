/*
 * Funcionalidad: Datos personales del usuario para el tutor
 * Descripción: Implementa ITutorPersonalData con UsersFacade: entrega el nombre completo del usuario y cada nombre o apellido de al menos tres caracteres para eliminarlos del texto que se envía a los proveedores de IA; v1.2: usa redactableNameTokens del guardián de datos personales, compartido con la retroalimentación de evaluaciones
 * Versión: 1.2
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";

import { redactableNameTokens } from "@/features/ai/domain/prompts/personal-data-guard";
import { type ITutorPersonalData } from "@/features/ai-tutor/application/ports/tutor-personal-data.interface";
import { UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

@Injectable()
export class UsersTutorPersonalData implements ITutorPersonalData {
  public constructor(private readonly _usersFacade: UsersFacade) {}

  public async getRedactableNames(userId: string): Promise<string[]> {
    const user: UserAccount | undefined = await this._usersFacade.getUserById(userId);

    return redactableNameTokens(user?.name);
  }
}
