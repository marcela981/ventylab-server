/*
 * Funcionalidad: Pruebas de TitleCaseName
 * Descripción: Pruebas unitarias del objeto de valor TitleCaseName
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidValueObjectError } from "@/common/domain/errors/invalid-value-object.error";
import { TitleCaseName } from "@/common/domain/value-objects/title-case-name";

describe("TitleCaseName value object", () => {
  describe("create", () => {
    it("should normalize a lowercase name to title case", () => {
      const name: TitleCaseName = TitleCaseName.create("juan esteban vanegas");

      expect(name.value).toBe("Juan Esteban Vanegas");
    });

    it("should normalize an uppercase name to title case", () => {
      const name: TitleCaseName = TitleCaseName.create("JUAN ESTEBAN VANEGAS");

      expect(name.value).toBe("Juan Esteban Vanegas");
    });

    it("should normalize a mixed-case name to title case", () => {
      const name: TitleCaseName = TitleCaseName.create("jUaN eStEbAn VaNeGaS");

      expect(name.value).toBe("Juan Esteban Vanegas");
    });

    it("should trim leading and trailing whitespace", () => {
      const name: TitleCaseName = TitleCaseName.create("  juan vanegas  ");

      expect(name.value).toBe("Juan Vanegas");
    });

    it("should collapse internal extra spaces", () => {
      const name: TitleCaseName = TitleCaseName.create("juan   esteban");

      expect(name.value).toBe("Juan Esteban");
    });

    it("should handle a single-word name", () => {
      const name: TitleCaseName = TitleCaseName.create("juan");

      expect(name.value).toBe("Juan");
    });

    it("should throw InvalidValueObjectError for an empty string", () => {
      expect(() => TitleCaseName.create("")).toThrow(InvalidValueObjectError);
    });

    it("should throw InvalidValueObjectError for a blank string", () => {
      expect(() => TitleCaseName.create("   ")).toThrow(InvalidValueObjectError);
    });
  });

  describe("equals", () => {
    it("should return true for two names with the same value", () => {
      expect(TitleCaseName.create("Juan Vanegas").equals(TitleCaseName.create("Juan Vanegas"))).toBe(true);
    });

    it("should return false for two names with different values", () => {
      expect(TitleCaseName.create("Juan Vanegas").equals(TitleCaseName.create("Pedro Vanegas"))).toBe(false);
    });

    it("should return true when comparing names that normalize to the same value", () => {
      expect(TitleCaseName.create("juan vanegas").equals(TitleCaseName.create("JUAN VANEGAS"))).toBe(true);
    });
  });
});
