/*
 * Funcionalidad: Codificador JSON de comandos
 * Descripción: Codificación por defecto: el JSON plano heredado que ya recibe el ventilador (mode, tidalVolume, respiratoryRate, peep, fio2 y los parámetros opcionales, con ieRatio como cadena "I:E") más el campo aditivo correlationId
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type CommandEncoder, type CommandEncodingValue, type EncodedCommand, JSON_COMMAND_ENCODING } from "@/features/ventilator-commands/domain/encoders/command-encoder";
import { VENTILATOR_COMMAND_NUMERIC_FIELDS, type VentilatorCommandParams } from "@/features/ventilator-commands/domain/value-objects/ventilator-command-params";

const IE_RATIO_DECIMALS: number = 2;

export function formatIeRatio(ratio: number): string {
  const round = (value: number): string => String(Number(value.toFixed(IE_RATIO_DECIMALS)));

  return ratio <= 1 ? `1:${round(1 / ratio)}` : `${round(ratio)}:1`;
}

export class JsonCommandEncoder implements CommandEncoder {
  public readonly encoding: CommandEncodingValue = JSON_COMMAND_ENCODING;

  public encode(command: VentilatorCommandParams, correlationId: string): EncodedCommand {
    const body: Record<string, string | number> = { mode: command.mode };

    for (const field of VENTILATOR_COMMAND_NUMERIC_FIELDS) {
      const value: number | undefined = command[field];

      if (value === undefined) {
        continue;
      }

      body[field] = field === "ieRatio" ? formatIeRatio(value) : value;
    }

    body.correlationId = correlationId;

    const payload: string = JSON.stringify(body);

    return { payload, printable: payload };
  }
}
