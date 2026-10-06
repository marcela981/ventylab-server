/*
 * Funcionalidad: Mapper de presentación de calificaciones
 * Descripción: Convierte las vistas de calificaciones a los DTOs de respuesta de /api/scores
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ScorePersonView, type ScoreView } from "@/features/scores/domain/read-models/score.read-model";
import { ScoreDTO, ScorePersonDTO } from "@/features/scores/presentation/dtos/score.dto";

export class ScoresMapper {
  public static toDTO(view: ScoreView): ScoreDTO {
    return new ScoreDTO({
      id: view.score.id,
      userId: view.score.userId,
      graderId: view.score.graderId,
      entityType: view.score.entityType,
      entityId: view.score.entityId,
      points: view.score.points,
      maxPoints: view.score.maxPoints,
      comments: view.score.comments ?? null,
      createdAt: view.score.createdAt,
      updatedAt: view.score.updatedAt,
      student: ScoresMapper._toPerson(view.student),
      grader: ScoresMapper._toPerson(view.grader),
    });
  }

  public static toDTOList(views: ScoreView[]): ScoreDTO[] {
    return views.map((view: ScoreView) => ScoresMapper.toDTO(view));
  }

  private static _toPerson(person?: ScorePersonView): ScorePersonDTO | null {
    return person ? new ScorePersonDTO({ id: person.id, name: person.name ?? null, email: person.email }) : null;
  }
}
