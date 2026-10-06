/*
 * Funcionalidad: Verificación de referencias de evaluaciones
 * Descripción: Comprueba dentro de la transacción que los medios y las referencias curriculares o clínicas citados por una evaluación existen, y lanza EvaluationMediaNotFoundError o EvaluationReferenceNotFoundError (422) con los faltantes
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { EvaluationMediaNotFoundError, EvaluationReferenceNotFoundError } from "@/features/evaluation/domain/evaluation.errors";
import { type EvaluationReferences, type IEvaluationsRepository } from "@/features/evaluation/domain/repositories/evaluations.repository";

export async function assertEvaluationReferencesExist(
  repository: IEvaluationsRepository,
  mediaIds: ReadonlyArray<string>,
  references: EvaluationReferences,
  transaction: unknown,
): Promise<void> {
  const uniqueMediaIds: string[] = [...new Set(mediaIds)];

  if (uniqueMediaIds.length > 0) {
    const missingMedia: string[] = await repository.findMissingMediaIds(uniqueMediaIds, transaction);

    if (missingMedia.length > 0) {
      throw new EvaluationMediaNotFoundError(missingMedia);
    }
  }

  if (Object.values(references).some((value: string | undefined) => value !== undefined)) {
    const missingReferences: string[] = await repository.findMissingReferences(references, transaction);

    if (missingReferences.length > 0) {
      throw new EvaluationReferenceNotFoundError(missingReferences);
    }
  }
}
