/*
 * Funcionalidad: Pruebas de la preferencia de apariencia del usuario
 * Descripción: changeThemePreference del agregado User conserva lo no enviado e informa si cambió; los guardas toThemeMode y toThemePalette descartan valores desconocidos (Ajustes D4)
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { User } from "@/features/users/domain/entities/user.entity";
import { toThemeMode, toThemePalette } from "@/features/users/domain/value-objects/theme-preference";
import { UserRole } from "@/features/users/domain/value-objects/user-role";

function user(): User {
  return User.reconstitute({
    id: "U1",
    email: "ana@ventylab.com",
    role: UserRole.create("STUDENT"),
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    auditLogs: [],
  });
}

describe("User appearance preference", () => {
  it("keeps the value that is not sent and reports whether anything changed", () => {
    const target: User = user();

    expect(target.changeThemePreference({ mode: "dark" })).toBe(true);
    expect(target.changeThemePreference({ palette: "univalle" })).toBe(true);
    expect(target.themeMode).toBe("dark");
    expect(target.themePalette).toBe("univalle");
    expect(target.changeThemePreference({ mode: "dark", palette: "univalle" })).toBe(false);
    expect(target.changeThemePreference({})).toBe(false);
  });

  it("drops unknown stored values", () => {
    expect(toThemeMode("light")).toBe("light");
    expect(toThemeMode("sepia")).toBeUndefined();
    expect(toThemeMode(null)).toBeUndefined();
    expect(toThemePalette("univalle")).toBe("univalle");
    expect(toThemePalette("VentyLab")).toBeUndefined();
  });
});
