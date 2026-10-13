/*
 * Funcionalidad: Pruebas del enmascarado de correos
 * Descripción: Verifica que maskEmailAddresses reemplace los correos en textos, arreglos y objetos anidados sin cambiar las claves, las fechas ni los valores que no son texto, y sin modificar el original
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { maskEmailAddresses, maskEmailsInText } from "@/common/domain/utils/mask-email-addresses";

describe("maskEmailAddresses", () => {
  it("should mask every email in a text and keep the rest", () => {
    const text: string = "From ana.maria+lab@correo.univalle.edu.co to PEDRO@VentyLab.com, version 1.2.3";

    const masked: string = maskEmailsInText(text);

    expect(masked).toBe("From [EMAIL] to [EMAIL], version 1.2.3");
  });

  it("should mask nested values without touching keys, dates or numbers", () => {
    const createdAt: Date = new Date("2026-10-13T00:00:00.000Z");
    const value: Record<string, unknown> = { "owner@ventylab.com": 1, list: ["x@y.io", 2], meta: { createdAt, count: 3 } };

    const masked: unknown = maskEmailAddresses(value);

    expect(masked).toEqual({ "owner@ventylab.com": 1, list: ["[EMAIL]", 2], meta: { createdAt, count: 3 } });
    expect(value.list).toEqual(["x@y.io", 2]);
  });
});
