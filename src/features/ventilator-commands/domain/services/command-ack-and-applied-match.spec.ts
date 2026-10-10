/*
 * Funcionalidad: Pruebas del acuse y de la coincidencia de parámetros aplicados
 * Descripción: Verifica la interpretación del JSON de acuse (commandId o correlationId, estados permitidos, motivo opcional, mensajes inválidos) y la coincidencia de los parámetros de una trama con los del comando dentro de la tolerancia relativa
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { settingsMatchCommand } from "@/features/ventilator-commands/domain/services/applied-settings-match";
import { type CommandAck, parseCommandAck } from "@/features/ventilator-commands/domain/services/command-ack";
import { type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

const VCV: VentilatorCommandParams = { mode: "VCV", tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 };

describe("parseCommandAck", () => {
  it("reads the command identifier, status and reason", () => {
    const acks: (CommandAck | undefined)[] = [
      parseCommandAck(JSON.stringify({ commandId: "a", status: "applied" })),
      parseCommandAck(Buffer.from(JSON.stringify({ correlationId: "b", status: "rejected", reason: "fault" }))),
    ];

    expect(acks).toEqual([
      { commandId: "a", status: "applied", reason: undefined },
      { commandId: "b", status: "rejected", reason: "fault" },
    ]);
  });

  it.each(["", "null", "[]", "{\"status\":\"applied\"}", "{\"commandId\":\"a\",\"status\":\"ok\"}", "{\"commandId\":5,\"status\":\"applied\"}"])("ignores the malformed acknowledgement %s", (payload: string) => {
    expect(parseCommandAck(payload)).toBeUndefined();
  });
});

describe("settingsMatchCommand", () => {
  it("matches every command parameter within the relative tolerance", () => {
    expect(settingsMatchCommand(VCV, { tidalVolume: 470, respiratoryRate: 14.5, peep: 5.2, fio2: 0.41, extra: 1 }, undefined, 0.05)).toBe(true);
  });

  it("fails when a parameter is missing, out of tolerance or the mode differs", () => {
    const results: boolean[] = [
      settingsMatchCommand(VCV, { tidalVolume: 450, respiratoryRate: 14, peep: 5 }, undefined, 0.05),
      settingsMatchCommand(VCV, { tidalVolume: 500, respiratoryRate: 14, peep: 5, fio2: 0.4 }, undefined, 0.05),
      settingsMatchCommand(VCV, { tidalVolume: 450, respiratoryRate: 14, peep: 5, fio2: 0.4 }, "PCV", 0.05),
      settingsMatchCommand({ mode: "VCV" }, {}, undefined, 0.05),
    ];

    expect(results).toEqual([false, false, false, false]);
  });
});
