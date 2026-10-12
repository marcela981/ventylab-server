/*
 * Funcionalidad: Pruebas de HmacPseudonymizer
 * Descripción: Verifica que el seudónimo es HMAC-SHA256 en hexadecimal con la sal como clave (vector calculado de forma independiente), estable para el mismo valor, distinto del valor original y entre sales, y que sin sal informa que no está configurado y lanza AnalyticsExportNotConfiguredError
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { fakeConfig } from "@/features/analytics/application/testing/analytics-test-doubles-spec";
import { AnalyticsExportNotConfiguredError } from "@/features/analytics/domain/analytics.errors";
import { HmacPseudonymizer } from "@/features/analytics/infrastructure/security/hmac-pseudonymizer";

describe("HmacPseudonymizer", () => {
  it("hashes with HMAC-SHA256 keyed by the salt", () => {
    const pseudonymizer: HmacPseudonymizer = new HmacPseudonymizer(fakeConfig("key"));

    expect(pseudonymizer.isConfigured).toBe(true);
    expect(pseudonymizer.pseudonymize("The quick brown fox jumps over the lazy dog")).toBe("f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8");
  });

  it("is stable per salt and never returns the original value", () => {
    const first: HmacPseudonymizer = new HmacPseudonymizer(fakeConfig("salt-number-one-0000"));
    const second: HmacPseudonymizer = new HmacPseudonymizer(fakeConfig("salt-number-two-0000"));

    expect(first.pseudonymize("user-1")).toBe(first.pseudonymize("user-1"));
    expect(first.pseudonymize("user-1")).not.toBe(second.pseudonymize("user-1"));
    expect(first.pseudonymize("user-1")).not.toContain("user-1");
  });

  it("refuses to pseudonymize without a salt", () => {
    const pseudonymizer: HmacPseudonymizer = new HmacPseudonymizer(fakeConfig(undefined));

    expect(pseudonymizer.isConfigured).toBe(false);
    expect(() => pseudonymizer.pseudonymize("user-1")).toThrow(AnalyticsExportNotConfiguredError);
  });
});
