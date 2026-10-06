/*
 * Funcionalidad: Servicio de propiedad de notas
 * Descripción: Decide si un usuario puede acceder a una nota: solo su autor, sin excepción por rol; una nota ajena o inexistente se reporta como no encontrada para no revelar su existencia
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type Note } from "@/features/notes/domain/entities/note.entity";
import { NoteNotFoundError } from "@/features/notes/domain/notes.errors";

export function resolveOwnedNote(note: Note | undefined, requesterId: string): Note {
  if (!note || !note.isOwnedBy(requesterId)) {
    throw new NoteNotFoundError();
  }

  return note;
}
