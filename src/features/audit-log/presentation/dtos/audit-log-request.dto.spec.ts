/*
 * Funcionalidad: Pruebas de los DTOs de petición de la bitácora de auditoría
 * Descripción: Verifica que el filtro de acción acepte cualquier texto de hasta 100 caracteres (incluidas acciones heredadas fuera del catálogo) y rechace valores más largos o que no sean texto
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { plainToInstance } from "class-transformer";
import { type ValidationError, validate } from "class-validator";

import { SearchAuditLogsQueryDTO } from "@/features/audit-log/presentation/dtos/audit-log-request.dto";

async function actionErrors(action: unknown): Promise<ValidationError[]> {
  const dto: SearchAuditLogsQueryDTO = plainToInstance(SearchAuditLogsQueryDTO, { action });
  const errors: ValidationError[] = await validate(dto);

  return errors.filter((error: ValidationError) => error.property === "action");
}

describe("SearchAuditLogsQueryDTO action filter", () => {
  it.each(["user_role_changed", "legacy_page_published", "CUSTOM.Action-1", "a".repeat(100)])("accepts %s", async (action: string) => {
    const errors: ValidationError[] = await actionErrors(action);

    expect(errors).toEqual([]);
  });

  it("rejects an action longer than 100 characters", async () => {
    const errors: ValidationError[] = await actionErrors("a".repeat(101));

    expect(errors).toHaveLength(1);
  });

  it("rejects a non-string action", async () => {
    const errors: ValidationError[] = await actionErrors(42);

    expect(errors).toHaveLength(1);
  });
});
