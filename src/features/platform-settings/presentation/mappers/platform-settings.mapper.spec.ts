/*
 * Funcionalidad: Pruebas de PlatformSettingsMapper
 * Descripción: Verifica que el DTO de un ajuste expone el tipo, la etiqueta, la unidad y la descripción, la unidad y el esquema de claves ausentes como null y el esquema de claves anidado convertido de forma recursiva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { PlatformSettingView } from "@/features/platform-settings/application/results/platform-setting-view.result";
import { type PlatformSettingDTO } from "@/features/platform-settings/presentation/dtos/platform-setting.dto";
import { PlatformSettingsMapper } from "@/features/platform-settings/presentation/mappers/platform-settings.mapper";

function view(overrides: Partial<ConstructorParameters<typeof PlatformSettingView>[0]>): PlatformSettingView {
  return new PlatformSettingView({
    key: "telemetry.flushIntervalMs",
    category: "telemetry",
    type: "integer",
    label: "Intervalo de envío de telemetría",
    unit: "milisegundos",
    description: "Intervalo de envío",
    value: 33,
    defaultValue: 33,
    origin: "DEFAULT",
    limits: { min: 5, max: 1000, integer: true },
    version: 0,
    ...overrides,
  });
}

describe("PlatformSettingsMapper", () => {
  it("exposes the form metadata and null for a missing unit or key schema", () => {
    const dto: PlatformSettingDTO = PlatformSettingsMapper.toDTO(view({ unit: undefined }));

    expect(dto).toMatchObject({ type: "integer", label: "Intervalo de envío de telemetría", unit: null, description: "Intervalo de envío", keySchema: null });
  });

  it("converts a nested key schema recursively", () => {
    const dto: PlatformSettingDTO = PlatformSettingsMapper.toDTO(
      view({
        key: "ai.prices",
        type: "map",
        unit: "USD por 1000 tokens",
        keySchema: {
          path: null,
          keyLabel: "Proveedor",
          allowedKeys: ["gemini"],
          valueType: "map",
          valueLimits: null,
          valueKeySchema: { path: null, keyLabel: "Modelo", allowedKeys: null, valueType: "object", valueLimits: { inputPer1kUsd: { min: 0, max: 1 } }, valueKeySchema: null },
        },
      }),
    );

    expect(dto.keySchema).toEqual({
      path: null,
      keyLabel: "Proveedor",
      allowedKeys: ["gemini"],
      valueType: "map",
      valueLimits: null,
      valueKeySchema: { path: null, keyLabel: "Modelo", allowedKeys: null, valueType: "object", valueLimits: { inputPer1kUsd: { min: 0, max: 1 } }, valueKeySchema: null },
    });
  });
});
