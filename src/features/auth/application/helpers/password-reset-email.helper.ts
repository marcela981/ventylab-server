/*
 * Funcionalidad: Correo de recuperación de contraseña
 * Descripción: Asunto y cuerpo (texto y HTML) en español del correo con el enlace de recuperación de contraseña; el enlace vence en 30 minutos y sirve una sola vez
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type SendEmailOptions } from "@/common/application/ports/email-service.interface";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildPasswordResetEmail({ to, name, link }: { to: string; name?: string; link: string }): SendEmailOptions {
  const greeting: string = name ? `Hola, ${name}:` : "Hola:";
  const lines: string[] = [
    greeting,
    "",
    "Recibimos una solicitud para restablecer la contraseña de tu cuenta de VentyLab.",
    "Para elegir una contraseña nueva, abre este enlace (vence en 30 minutos y solo se puede usar una vez):",
    link,
    "",
    "Si no la solicitaste, ignora este correo: tu contraseña no cambia.",
    "",
    "VentyLab",
  ];
  const html: string = [
    `<p>${escapeHtml(greeting)}</p>`,
    "<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de VentyLab.</p>",
    `<p><a href="${escapeHtml(link)}">Elegir una contraseña nueva</a> (el enlace vence en 30 minutos y solo se puede usar una vez).</p>`,
    "<p>Si no la solicitaste, ignora este correo: tu contraseña no cambia.</p>",
    "<p>VentyLab</p>",
  ].join("\n");

  return { to, subject: "Restablece tu contraseña de VentyLab", body: lines.join("\n"), html };
}
