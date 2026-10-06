/*
 * Funcionalidad: Value object NoteContent
 * Descripción: Contenido de texto enriquecido de una nota como documento Tiptap validado y saneado, que no puede quedar vacío y expone su versión en texto plano
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidNoteContentError } from "@/features/notes/domain/notes.errors";
import { sanitizeTiptapDocument, type TiptapDocument, tiptapToPlainText } from "@/features/notes/domain/services/tiptap-document";

export class NoteContent {
  private readonly _document: TiptapDocument;
  private readonly _plainText: string;

  private constructor(document: TiptapDocument, plainText: string) {
    this._document = document;
    this._plainText = plainText;
  }

  public get document(): TiptapDocument {
    return this._document;
  }

  public get plainText(): string {
    return this._plainText;
  }

  public static create(value: unknown): NoteContent {
    const document: TiptapDocument = sanitizeTiptapDocument(value);
    const plainText: string = tiptapToPlainText(document);

    if (plainText.length === 0) {
      throw new InvalidNoteContentError("the note has no text");
    }

    return new NoteContent(document, plainText);
  }

  public static reconstitute(value: unknown): NoteContent {
    const document: TiptapDocument = sanitizeTiptapDocument(value);

    return new NoteContent(document, tiptapToPlainText(document));
  }
}
