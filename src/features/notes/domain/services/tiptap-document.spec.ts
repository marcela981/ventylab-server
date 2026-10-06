/*
 * Funcionalidad: Pruebas del servicio de documentos Tiptap
 * Descripción: Verifica la validación estructural, el saneamiento de HTML y URLs y la conversión a texto plano de documentos Tiptap, y el contenido de nota no vacío
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { InvalidNoteContentError } from "@/features/notes/domain/notes.errors";
import {
  sanitizeTiptapDocument,
  stripHtmlTags,
  TIPTAP_MAX_DEPTH,
  type TiptapDocument,
  type TiptapNode,
  tiptapToPlainText,
} from "@/features/notes/domain/services/tiptap-document";
import { NoteContent } from "@/features/notes/domain/value-objects/note-content";

function paragraph(text: string): Record<string, unknown> {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

describe("Tiptap document service", () => {
  describe("stripHtmlTags", () => {
    it("should remove tags, script blocks and comments", () => {
      const input: string = "<b>Bold</b><script>alert(1)</script><!-- hidden -->text<img src=x onerror=alert(1)>";

      const output: string = stripHtmlTags(input);

      expect(output).toBe("Boldtext");
    });

    it("should keep comparison signs used in clinical text", () => {
      const input: string = "PEEP < 5 and FiO2 > 0.6";

      const output: string = stripHtmlTags(input);

      expect(output).toBe("PEEP < 5 and FiO2 > 0.6");
    });

    it("should not rebuild a tag from nested fragments", () => {
      const input: string = "<scr<script>ipt>alert(1)</script>";

      const output: string = stripHtmlTags(input);

      expect(output).not.toMatch(/<script/i);
    });
  });

  describe("sanitizeTiptapDocument", () => {
    it("should keep a valid document and drop unknown keys", () => {
      const input: Record<string, unknown> = { type: "doc", content: [{ ...paragraph("Tidal volume"), extra: "x" }] };

      const document: TiptapDocument = sanitizeTiptapDocument(input);

      expect(document).toEqual({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Tidal volume" }] }] });
    });

    it("should strip HTML from text nodes and drop text nodes left empty", () => {
      const input: Record<string, unknown> = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "<em>Compliance</em>" }, { type: "text", text: "<script>x</script>" }] }],
      };

      const document: TiptapDocument = sanitizeTiptapDocument(input);

      expect(document.content[0].content).toEqual([{ type: "text", text: "Compliance" }]);
    });

    it("should drop unsafe link URLs and keep safe ones", () => {
      const input: Record<string, unknown> = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "bad", marks: [{ type: "link", attrs: { href: "javascript:alert(1)", target: "_blank" } }] },
              { type: "text", text: "good", marks: [{ type: "link", attrs: { href: "https://ventylab.com" } }] },
            ],
          },
        ],
      };

      const document: TiptapDocument = sanitizeTiptapDocument(input);
      const texts: TiptapNode[] = document.content[0].content ?? [];

      expect(texts[0].marks).toEqual([{ type: "link", attrs: { target: "_blank" } }]);
      expect(texts[1].marks).toEqual([{ type: "link", attrs: { href: "https://ventylab.com" } }]);
    });

    it("should reject a root that is not a doc", () => {
      const act = (): TiptapDocument => sanitizeTiptapDocument({ type: "paragraph", content: [] });

      expect(act).toThrow(InvalidNoteContentError);
    });

    it("should reject nodes without a valid type", () => {
      const act = (): TiptapDocument => sanitizeTiptapDocument({ type: "doc", content: [{ type: "<b>" }] });

      expect(act).toThrow(InvalidNoteContentError);
    });

    it("should reject text on non-text nodes", () => {
      const act = (): TiptapDocument => sanitizeTiptapDocument({ type: "doc", content: [{ type: "paragraph", text: "x" }] });

      expect(act).toThrow(InvalidNoteContentError);
    });

    it("should reject object attribute values", () => {
      const act = (): TiptapDocument => sanitizeTiptapDocument({ type: "doc", content: [{ type: "heading", attrs: { level: { nested: 1 } } }] });

      expect(act).toThrow(InvalidNoteContentError);
    });

    it("should reject documents nested too deeply", () => {
      let node: Record<string, unknown> = paragraph("deep");

      for (let level: number = 0; level <= TIPTAP_MAX_DEPTH; level += 1) {
        node = { type: "blockquote", content: [node] };
      }

      const act = (): TiptapDocument => sanitizeTiptapDocument({ type: "doc", content: [node] });

      expect(act).toThrow(InvalidNoteContentError);
    });
  });

  describe("tiptapToPlainText", () => {
    it("should join blocks with new lines, keep hard breaks and prefix list items", () => {
      const document: TiptapDocument = sanitizeTiptapDocument({
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Modes" }] },
          { type: "paragraph", content: [{ type: "text", text: "Volume " }, { type: "text", text: "control", marks: [{ type: "bold" }] }, { type: "hardBreak" }, { type: "text", text: "Pressure control" }] },
          { type: "bulletList", content: [{ type: "listItem", content: [paragraph("PEEP")] }, { type: "listItem", content: [paragraph("FiO2")] }] },
        ],
      });

      const text: string = tiptapToPlainText(document);

      expect(text).toBe("Modes\nVolume control\nPressure control\n- PEEP\n- FiO2");
    });
  });

  describe("NoteContent", () => {
    it("should reject a document without text", () => {
      const act = (): NoteContent => NoteContent.create({ type: "doc", content: [{ type: "paragraph" }] });

      expect(act).toThrow(InvalidNoteContentError);
    });

    it("should expose the sanitized plain text", () => {
      const content: NoteContent = NoteContent.create({ type: "doc", content: [paragraph("<i>Plateau</i> pressure")] });

      expect(content.plainText).toBe("Plateau pressure");
    });
  });
});
