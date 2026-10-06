/*
 * Funcionalidad: Puerto IEmailService
 * Descripción: Define el contrato, las opciones de envío y el token de inyección del servicio de correo electrónico
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export const EMAIL_SERVICE_TOKEN: unique symbol = Symbol("EMAIL_SERVICE_TOKEN");

export interface IEmailService {
  send(options: SendEmailOptions): Promise<void>;
}
