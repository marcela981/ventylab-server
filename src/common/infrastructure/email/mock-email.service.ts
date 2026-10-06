/*
 * Funcionalidad: Servicio MockEmailService
 * Descripción: Implementación simulada de IEmailService que solo registra los correos en el log
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable, Logger } from "@nestjs/common";

import {
  type IEmailService,
  type SendEmailOptions,
} from "@/common/application/ports/email-service.interface";

@Injectable()
export class MockEmailService implements IEmailService {
  private readonly _logger: Logger = new Logger(MockEmailService.name);

  public async send({ to, subject, body }: SendEmailOptions): Promise<void> {
    this._logger.debug(`[MOCK EMAIL] to=${to} subject="${subject}" body=${body}`);

    await Promise.resolve();
  }
}
