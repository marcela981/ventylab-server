/*
 * Funcionalidad: Arranque e2e con variables de entorno sobrescritas
 * Descripción: ConfigModule valida y fija el entorno cuando se evalúa AppModule por primera vez en el archivo de prueba, así que este ayudante aplica las sobrescrituras (por ejemplo, URL de un proxy local o tiempos de espera cortos) antes de importar e2e-app de forma diferida, verifica que el entorno siga siendo local y devuelve una función para restaurarlo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { assertLocalTestEnvironment } from "./test-env";

import type * as E2eAppModule from "./e2e-app";

export interface OverriddenE2eApp {
  readonly e2e: E2eAppModule.E2eApp;
  restore(): Promise<void>;
}

// The spec file must not import e2e-app (or AppModule) statically: the first evaluation of AppModule freezes the configuration.
export async function createE2eAppWithEnvironment(overrides: Readonly<Record<string, string>>, options: E2eAppModule.E2eAppOptions = {}): Promise<OverriddenE2eApp> {
  const previous: Record<string, string | undefined> = Object.fromEntries(Object.keys(overrides).map((key: string): [string, string | undefined] => [key, process.env[key]]));
  const restoreEnvironment = (): void => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  Object.assign(process.env, overrides);

  try {
    assertLocalTestEnvironment();

    const { createE2eApp }: typeof E2eAppModule = jest.requireActual<typeof E2eAppModule>("./e2e-app");
    const e2e: E2eAppModule.E2eApp = await createE2eApp(options);

    return {
      e2e,
      restore: async (): Promise<void> => {
        await e2e.close();
        restoreEnvironment();
      },
    };
  } catch (error: unknown) {
    restoreEnvironment();

    throw error;
  }
}
