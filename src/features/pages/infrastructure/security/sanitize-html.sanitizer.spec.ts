/*
 * Funcionalidad: Pruebas de validación y saneamiento de bloques
 * Descripción: Verifica con el saneador real (sanitize-html) que normalizeBlock elimine scripts y enlaces peligrosos del contenido Tiptap y HTML, conserve el Markdown, exija media en imagen y archivo, y restrinja los videos externos a YouTube y Vimeo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type BlockValidationResult, normalizeBlock } from "@/features/pages/domain/services/page-block-content";
import { SanitizeHtmlSanitizer } from "@/features/pages/infrastructure/security/sanitize-html.sanitizer";

const sanitizer: SanitizeHtmlSanitizer = new SanitizeHtmlSanitizer();

describe("normalizeBlock with SanitizeHtmlSanitizer", () => {
  it("strips markup from Tiptap text nodes and keeps plain text characters", () => {
    const content: unknown = {
      doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a < b <script>alert(1)</script>", marks: [{ type: "bold" }] }] }] },
    };

    const result: BlockValidationResult = normalizeBlock({ type: "TEXT", content }, sanitizer);

    expect(result).toEqual({
      valid: true,
      content: { doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a < b ", marks: [{ type: "bold" }] }] }] } },
    });
  });

  it("rejects links with a javascript scheme", () => {
    const content: unknown = {
      doc: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] }],
      },
    };

    const result: BlockValidationResult = normalizeBlock({ type: "TEXT", content }, sanitizer);

    expect(result).toEqual({ valid: false, reason: "invalid_tiptap_document" });
  });

  it("removes disallowed HTML and keeps Markdown syntax", () => {
    const result: BlockValidationResult = normalizeBlock(
      { type: "THEORY", content: { html: "<p onclick=\"x()\">ok</p><script>bad()</script>", markdown: "> cita\n\n**PEEP** > 5" } },
      sanitizer,
    );

    expect(result).toEqual({ valid: true, content: { html: "<p>ok</p>", markdown: "> cita\n\n**PEEP** > 5" } });
  });

  it("requires a media ID for image and file blocks", () => {
    const missing: BlockValidationResult = normalizeBlock({ type: "IMAGE", content: { caption: "Curva" } }, sanitizer);
    const present: BlockValidationResult = normalizeBlock({ type: "FILE", content: {}, mediaId: "media-1" }, sanitizer);

    expect(missing).toEqual({ valid: false, reason: "media_required" });
    expect(present).toEqual({ valid: true, content: {}, mediaId: "media-1" });
  });

  it("accepts YouTube and Vimeo videos and rejects other hosts or both sources", () => {
    const youtube: BlockValidationResult = normalizeBlock({ type: "VIDEO", content: { url: "https://www.youtube.com/watch?v=abc" } }, sanitizer);
    const vimeo: BlockValidationResult = normalizeBlock({ type: "VIDEO", content: { url: "https://player.vimeo.com/video/1" } }, sanitizer);
    const other: BlockValidationResult = normalizeBlock({ type: "VIDEO", content: { url: "https://evil.example.com/v.mp4" } }, sanitizer);
    const both: BlockValidationResult = normalizeBlock({ type: "VIDEO", content: { url: "https://youtu.be/abc" }, mediaId: "media-1" }, sanitizer);

    expect(youtube.valid).toBe(true);
    expect(vimeo.valid).toBe(true);
    expect(other).toEqual({ valid: false, reason: "video_host_not_allowed" });
    expect(both).toEqual({ valid: false, reason: "video_source_required" });
  });

  it("stores the KaTeX source of equation blocks", () => {
    const valid: BlockValidationResult = normalizeBlock({ type: "EQUATION", content: { latex: "P = \\dot{V} R", display: true, extra: 1 } }, sanitizer);
    const empty: BlockValidationResult = normalizeBlock({ type: "EQUATION", content: { latex: " " } }, sanitizer);

    expect(valid).toEqual({ valid: true, content: { latex: "P = \\dot{V} R", display: true } });
    expect(empty).toEqual({ valid: false, reason: "invalid_equation" });
  });
});
