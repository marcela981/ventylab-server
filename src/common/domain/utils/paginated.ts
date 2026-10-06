/*
 * Funcionalidad: Tipo Paginated
 * Descripción: Define la estructura genérica de resultados paginados con elementos y total
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface Pagination {
  total: number;

  pages: number;

  page: number;

  limit: number;

  next?: number;

  previous?: number;
}

export class Paginated<T> {
  public readonly data: T[];

  public readonly pagination: Pagination;

  public constructor({ items, total, page, limit }: { items: T[]; total: number; page: number; limit: number }) {
    const pages: number = Math.ceil(total / limit);

    this.data = items;
    this.pagination = {
      total,
      pages,
      page,
      limit,
      next: page < pages ? page + 1 : undefined,
      previous: page > 1 ? page - 1 : undefined,
    };
  }

  public map<U>(mapper: (item: T) => U): Paginated<U> {
    return new Paginated({
      items: this.data.map(mapper),
      total: this.pagination.total,
      page: this.pagination.page,
      limit: this.pagination.limit,
    });
  }
}
