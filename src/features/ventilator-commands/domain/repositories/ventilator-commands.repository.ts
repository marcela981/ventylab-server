/*
 * Funcionalidad: Repositorio de comandos del ventilador
 * Descripción: Contrato de persistencia del historial de comandos (ventilator_commands): guardado por upsert de cada estado y listado paginado de los comandos de una reserva
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type ListQuery } from "@/common/domain/utils/list-query";
import { type Paginated } from "@/common/domain/utils/paginated";
import { type VentilatorCommand } from "@/features/ventilator-commands/domain/entities/ventilator-command.entity";

export const VENTILATOR_COMMANDS_REPOSITORY_TOKEN: unique symbol = Symbol("VENTILATOR_COMMANDS_REPOSITORY_TOKEN");

export interface GetVentilatorCommandsQuery extends ListQuery {
  reservationId: string;
}

export interface IVentilatorCommandsRepository {
  save(command: VentilatorCommand, transaction?: unknown): Promise<void>;
  getByReservation(query: GetVentilatorCommandsQuery, transaction?: unknown): Promise<Paginated<VentilatorCommand>>;
}
