/*
 * Funcionalidad: Pipe TrimPipe
 * Descripción: Recorta recursivamente los textos de body, query y params antes de la validación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, type ArgumentMetadata, type PipeTransform } from "@nestjs/common";

const TRIMMABLE_METADATA_TYPES: ReadonlySet<ArgumentMetadata["type"]> = new Set(["body", "query", "param"]);

@Injectable()
export class TrimPipe implements PipeTransform {
  public transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (!TRIMMABLE_METADATA_TYPES.has(metadata.type)) {
      return value;
    }

    return this._trimDeep(value);
  }

  private _trimDeep(value: unknown): unknown {
    if (typeof value === "string") {
      return value.trim();
    }

    if (Array.isArray(value)) {
      return value.map((item: unknown) => this._trimDeep(item));
    }

    if (value !== null && typeof value === "object" && value.constructor === Object) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, val]: [string, unknown]) => [key, this._trimDeep(val)]),
      );
    }

    return value;
  }
}
