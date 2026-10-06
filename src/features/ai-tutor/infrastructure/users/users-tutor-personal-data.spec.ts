/*
 * Funcionalidad: Pruebas del adaptador de datos personales del tutor de IA
 * Descripción: Verifica que el adaptador sobre UsersFacade devuelva el nombre completo del usuario y cada nombre o apellido de al menos tres caracteres para que se eliminen del texto enviado a los proveedores, y nada cuando el usuario no tiene nombre o no existe
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { UsersTutorPersonalData } from "@/features/ai-tutor/infrastructure/users/users-tutor-personal-data";
import { type UsersFacade } from "@/features/users/application/services/users.facade";
import { type UserAccount } from "@/features/users/domain/read-models/user-account.read-model";

function adapterFor(user: Partial<UserAccount> | undefined): UsersTutorPersonalData {
  const facade: { getUserById: jest.Mock } = { getUserById: jest.fn().mockResolvedValue(user) };

  return new UsersTutorPersonalData(facade as unknown as UsersFacade);
}

describe("UsersTutorPersonalData", () => {
  it("should return the full name and every given name or surname token of at least three characters (check 13)", async () => {
    const adapter: UsersTutorPersonalData = adapterFor({ id: "u-1", name: "  Ana  María de la Peña Li " });

    const names: string[] = await adapter.getRedactableNames("u-1");

    expect(names).toEqual(["Ana María de la Peña Li", "Ana", "María", "Peña"]);
  });

  it("should not repeat a token equal to the full name", async () => {
    const adapter: UsersTutorPersonalData = adapterFor({ id: "u-1", name: "Valentina" });

    const names: string[] = await adapter.getRedactableNames("u-1");

    expect(names).toEqual(["Valentina"]);
  });

  it.each([
    ["has no name", { id: "u-1" }],
    ["has a blank name", { id: "u-1", name: "   " }],
    ["does not exist", undefined],
  ])("should return nothing when the user %s", async (_label: string, user: Partial<UserAccount> | undefined) => {
    const adapter: UsersTutorPersonalData = adapterFor(user);

    const names: string[] = await adapter.getRedactableNames("u-1");

    expect(names).toEqual([]);
  });
});
