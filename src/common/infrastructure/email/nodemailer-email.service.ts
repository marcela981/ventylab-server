/*
 * Funcionalidad: Servicio NodemailerEmailService
 * Descripción: Implementa IEmailService con Nodemailer usando la configuración SMTP
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";

import {
  type IEmailService,
  type SendEmailOptions,
} from "@/common/application/ports/email-service.interface";
import { EnvironmentVariables } from "@/common/infrastructure/config/env.validation";

@Injectable()
export class NodemailerEmailService implements IEmailService {
  private readonly _transporter: Transporter;
  private readonly _from: string;

  public constructor(private readonly _config: ConfigService<EnvironmentVariables, true>) {
    const host: string = this._config.get("SMTP_HOST", { infer: true });
    const port: number = this._config.get("SMTP_PORT", { infer: true });
    const secure: boolean = this._config.get("SMTP_SECURE", { infer: true });
    const user: string | undefined = this._config.get("SMTP_USER", { infer: true });
    const pass: string | undefined = this._config.get("SMTP_PASS", { infer: true });

    this._from = this._config.get("SMTP_FROM", { infer: true });

    this._transporter = createTransport({
      host,
      port,
      secure,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  }

  public async send({ to, subject, body, html }: SendEmailOptions): Promise<void> {
    await this._transporter.sendMail({
      from: this._from,
      to,
      subject,
      text: body,
      html,
    });
  }
}
