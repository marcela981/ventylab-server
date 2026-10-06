/*
 * Funcionalidad: Constructor APIResponseBuilder
 * Descripción: Construye el envoltorio estándar de respuesta con éxito, mensaje, datos, código, traceId y paginación
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Pagination } from "@/common/domain/utils/paginated";
import { APIResponse, APIPagination } from "@/common/presentation/dtos/api-response.dto";

export class APIResponseBuilder<T> {
  private _success: boolean = true;
  private _message: string | string[] | null = null;
  private _data: T | null = null;
  private _code: string | null = null;
  private _traceId: string | null = null;
  private _pagination: APIPagination | null = null;

  public setData(data: T): this {
    this._data = data;
    return this;
  }

  public setSuccess(success: boolean): this {
    this._success = success;
    return this;
  }

  public setMessage(message: string | string[]): this {
    this._message = message;
    return this;
  }

  public setCode(code: string): this {
    this._code = code;
    return this;
  }

  public setTraceId(traceId: string | null): this {
    this._traceId = traceId;
    return this;
  }

  public setPagination(pagination: Pagination | null): this {
    if (pagination === null) {
      this._pagination = null;
    } else {
      this._pagination = {
        total: pagination.total,
        pages: pagination.pages,
        page: pagination.page,
        limit: pagination.limit,
        next: pagination.next ?? null,
        previous: pagination.previous ?? null,
      };
    }
    return this;
  }

  public build(): APIResponse<T> {
    return {
      success: this._success,
      message: this._message,
      data: this._data,
      code: this._code,
      timestamp: new Date().toISOString(),
      traceId: this._traceId,
      pagination: this._pagination,
    };
  }
}
