/*
 * Funcionalidad: Caso de uso GetActivityCatalogUseCase
 * Descripción: Catálogo de actividades activas filtrable por tipo (más antiguas primero); los estudiantes solo ven las publicadas
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Inject, Injectable } from "@nestjs/common";

import { type Activity } from "@/features/activities/domain/entities/activity.entity";
import { ACTIVITIES_REPOSITORY_TOKEN, type IActivitiesRepository } from "@/features/activities/domain/repositories/activities.repository";
import { isStudentRole } from "@/features/activities/domain/services/activity-access-policy";
import { type ActivityTypeValue } from "@/features/activities/domain/value-objects/activity-type";

@Injectable()
export class GetActivityCatalogUseCase {
  public constructor(
    @Inject(ACTIVITIES_REPOSITORY_TOKEN)
    private readonly _activitiesRepository: IActivitiesRepository,
  ) {}

  public async execute(role: string, type?: ActivityTypeValue): Promise<Activity[]> {
    return await this._activitiesRepository.getCatalog({ type, publishedOnly: isStudentRole(role) });
  }
}
