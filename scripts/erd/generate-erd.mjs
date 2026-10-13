/*
 * Funcionalidad: Generador del diagrama entidad-relación
 * Descripción: Lee prisma/schema.prisma (DMMF de @prisma/internals si está disponible; si no, un parser del texto del esquema) y escribe un erDiagram de Mermaid determinista en docs/erd/erd.md, con modelos, campos, marcas PK/FK/UK y relaciones con cardinalidad
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SCHEMA_PATH = resolve(ROOT, "prisma", "schema.prisma");
const OUTPUT_PATH = resolve(ROOT, "docs", "erd", "erd.md");

const HEADER = `<!--
  Funcionalidad: Diagrama entidad-relación generado
  Descripción: Diagrama Mermaid (erDiagram) generado a partir de prisma/schema.prisma por scripts/erd/generate-erd.mjs; no se edita a mano
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->`;

const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function stripComment(line) {
  let inString = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' && line[i - 1] !== "\\") {
      inString = !inString;
    } else if (!inString && ch === "/" && line[i + 1] === "/") {
      return line.slice(0, i);
    }
  }

  return line;
}

function readBracketList(text, key) {
  const match = new RegExp(`${key}\\s*:\\s*\\[([^\\]]*)\\]`).exec(text);

  if (!match) {
    return [];
  }

  return match[1]
    .split(",")
    .map((part) => part.trim().replace(/\(.*\)$/, ""))
    .filter(Boolean);
}

function readAttributeArgs(text, attribute) {
  const start = text.indexOf(attribute + "(");

  if (start === -1) {
    return null;
  }

  let depth = 0;

  for (let i = start + attribute.length; i < text.length; i++) {
    if (text[i] === "(") {
      depth++;
    } else if (text[i] === ")") {
      depth--;

      if (depth === 0) {
        return text.slice(start + attribute.length + 1, i);
      }
    }
  }

  return null;
}

function readBlockFieldList(args) {
  const match = /^\s*(?:fields\s*:\s*)?\[([^\]]*)\]/.exec(args);

  if (!match) {
    return [];
  }

  return match[1]
    .split(",")
    .map((part) => part.trim().replace(/\(.*\)$/, ""))
    .filter(Boolean);
}

function parseSchemaText(source) {
  const lines = source.split(/\r?\n/).map(stripComment);
  const models = [];
  const enums = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      continue;
    }

    const open = /^(model|enum|view|type)\s+(\w+)\s*\{$/.exec(line);

    if (open) {
      current = { kind: open[1], name: open[2], lines: [] };
      continue;
    }

    if (line === "}" && current) {
      if (current.kind === "model") {
        models.push(current);
      } else if (current.kind === "enum") {
        enums.push(current);
      }

      current = null;
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  const enumNames = new Set(enums.map((e) => e.name));
  const modelNames = new Set(models.map((m) => m.name));

  const parsedModels = models.map((block) => {
    const model = { name: block.name, dbName: null, fields: [], primaryKey: [], uniqueSets: [] };

    for (const line of block.lines) {
      if (line.startsWith("@@")) {
        const idArgs = readAttributeArgs(line, "@@id");
        const uniqueArgs = readAttributeArgs(line, "@@unique");
        const mapArgs = readAttributeArgs(line, "@@map");

        if (idArgs !== null) {
          model.primaryKey = readBlockFieldList(idArgs);
        }

        if (uniqueArgs !== null) {
          model.uniqueSets.push(readBlockFieldList(uniqueArgs));
        }

        if (mapArgs !== null) {
          model.dbName = /"([^"]*)"/.exec(mapArgs)?.[1] ?? null;
        }

        continue;
      }

      const fieldMatch = /^(\w+)\s+(\w+)(\[\])?(\?)?(.*)$/.exec(line);

      if (!fieldMatch) {
        continue;
      }

      const [, name, type, list, optional, rest] = fieldMatch;
      const relationArgs = readAttributeArgs(rest, "@relation");
      const isObject = modelNames.has(type);
      const field = {
        name,
        type,
        kind: isObject ? "object" : enumNames.has(type) ? "enum" : "scalar",
        isList: Boolean(list),
        isRequired: !optional && !list,
        isId: /(^|\s)@id(\s|$|\()/.test(rest),
        isUnique: /(^|\s)@unique(\s|$|\()/.test(rest),
        relationName: null,
        relationFromFields: [],
        relationToFields: [],
      };

      if (isObject) {
        const explicitName = relationArgs === null ? null : /^\s*(?:name\s*:\s*)?"([^"]*)"/.exec(relationArgs)?.[1] ?? null;

        field.relationName = explicitName ?? [block.name, type].sort(byString).join("To");
        field.relationFromFields = relationArgs === null ? [] : readBracketList(relationArgs, "fields");
        field.relationToFields = relationArgs === null ? [] : readBracketList(relationArgs, "references");
      }

      if (field.isId) {
        model.primaryKey = [name];
      }

      model.fields.push(field);
    }

    return model;
  });

  return {
    models: parsedModels,
    enums: enums.map((e) => ({
      name: e.name,
      values: e.lines.filter((l) => !l.startsWith("@@")).map((l) => l.split(/\s+/)[0]),
    })),
  };
}

async function loadFromDmmf(source) {
  const require = createRequire(resolve(ROOT, "package.json"));
  let internals;

  try {
    internals = require(require.resolve("@prisma/internals"));
  } catch {
    return null;
  }

  const dmmf = await internals.getDMMF({ datamodel: source });

  return {
    models: dmmf.datamodel.models.map((m) => ({
      name: m.name,
      dbName: m.dbName ?? null,
      fields: m.fields.map((f) => ({
        name: f.name,
        type: f.type,
        kind: f.kind === "object" ? "object" : f.kind === "enum" ? "enum" : "scalar",
        isList: f.isList,
        isRequired: f.isRequired && !f.isList,
        isId: f.isId,
        isUnique: f.isUnique,
        relationName: f.relationName ?? null,
        relationFromFields: f.relationFromFields ?? [],
        relationToFields: f.relationToFields ?? [],
      })),
      primaryKey: m.primaryKey?.fields ?? m.fields.filter((f) => f.isId).map((f) => f.name),
      uniqueSets: m.uniqueFields ?? [],
    })),
    enums: dmmf.datamodel.enums.map((e) => ({ name: e.name, values: e.values.map((v) => v.name) })),
  };
}

function sameSet(a, b) {
  return a.length === b.length && a.every((x) => b.includes(x));
}

function buildRelations(models) {
  const byName = new Map();

  for (const model of models) {
    for (const field of model.fields) {
      if (field.kind !== "object") {
        continue;
      }

      const key = field.relationName;
      const entry = byName.get(key) ?? [];

      entry.push({ model, field });
      byName.set(key, entry);
    }
  }

  const relations = [];

  for (const [name, sides] of [...byName.entries()].sort(([a], [b]) => byString(a, b))) {
    const owner = sides.find((s) => s.field.relationFromFields.length > 0);

    if (!owner) {
      const [a, b] = [...sides].sort((x, y) => byString(x.model.name + x.field.name, y.model.name + y.field.name));

      relations.push({ left: a.model.name, right: (b ?? a).model.name, cardinality: "}o--o{", label: name, note: "implicit many-to-many" });
      continue;
    }

    const other = sides.find((s) => s !== owner) ?? owner;
    const fkFields = owner.field.relationFromFields;
    const fkRequired = fkFields.every((fk) => owner.model.fields.find((f) => f.name === fk)?.isRequired);
    const oneToOne =
      (fkFields.length === 1 && owner.model.fields.find((f) => f.name === fkFields[0])?.isUnique) ||
      owner.model.uniqueSets.some((set) => sameSet(set, fkFields)) ||
      sameSet(owner.model.primaryKey, fkFields);
    const parentSide = fkRequired ? "||" : "|o";
    const childSide = oneToOne ? "o|" : "o{";

    relations.push({
      left: other.model.name,
      right: owner.model.name,
      cardinality: `${parentSide}--${childSide}`,
      label: `${owner.field.name} (${fkFields.join(", ")})`,
      note: null,
    });
  }

  return relations.sort((a, b) => byString(a.left, b.left) || byString(a.right, b.right) || byString(a.label, b.label));
}

function renderAttribute(model, field, fkNames) {
  const markers = [];

  if (model.primaryKey.includes(field.name)) {
    markers.push("PK");
  }

  if (fkNames.has(field.name)) {
    markers.push("FK");
  }

  if (field.isUnique || model.uniqueSets.some((set) => set.length === 1 && set[0] === field.name)) {
    markers.push("UK");
  }

  const type = `${field.type}${field.isList ? "[]" : ""}`;
  const comment = field.isRequired || field.isList ? "" : ' "optional"';

  return `    ${type} ${field.name}${markers.length ? " " + markers.join(", ") : ""}${comment}`;
}

function render(schema, source) {
  const models = [...schema.models].sort((a, b) => byString(a.name, b.name));
  const enums = [...schema.enums].sort((a, b) => byString(a.name, b.name));
  const relations = buildRelations(models);
  const relationLines = relations.map((r) => `  ${r.left} ${r.cardinality} ${r.right} : "${r.label.replace(/"/g, "'")}"`);

  const detailed = ["```mermaid", "erDiagram"];

  for (const model of models) {
    const fkNames = new Set(model.fields.flatMap((f) => f.relationFromFields));

    detailed.push(`  ${model.name} {`);

    for (const field of model.fields) {
      if (field.kind !== "object") {
        detailed.push(renderAttribute(model, field, fkNames));
      }
    }

    detailed.push("  }");
  }

  detailed.push(...relationLines, "```");

  const overview = ["```mermaid", "erDiagram", ...relationLines, "```"];

  const out = [
    HEADER,
    "",
    "# Entity-relationship diagram",
    "",
    "Generated from `prisma/schema.prisma` by `scripts/erd/generate-erd.mjs`. Do not edit by hand: run `node scripts/erd/generate-erd.mjs` after changing the schema and commit the result.",
    "",
    `- Source: \`prisma/schema.prisma\` (parsed with ${source}).`,
    `- Models: ${models.length}. Enums: ${enums.length}. Relations: ${relations.length}.`,
    "- Markers: `PK` primary key, `FK` foreign key (scalar listed in `@relation(fields: ...)`), `UK` single-column unique. Composite primary keys mark every member column `PK`; composite unique constraints are listed in the table below.",
    '- Cardinality: `||` exactly one, `|o` zero or one, `o{` zero or many, `o|` zero or one on the child side (one-to-one). The parent side is `|o` when the foreign key is nullable. Relation labels name the owning field and its foreign-key columns. `"optional"` marks nullable scalar columns.',
    "- Why a custom script instead of `prisma-erd-generator`: that generator needs a `generator` block in `schema.prisma` (it would run on every `prisma generate`, including `postinstall`) and renders through `@mermaid-js/mermaid-cli`, which pulls Puppeteer and a headless Chromium. This script adds no dependency, does not touch the schema, and its output is plain Mermaid text that GitHub and most Markdown viewers render.",
    "",
    "## Relationships overview",
    "",
    ...overview,
    "",
    "## Full diagram",
    "",
    ...detailed,
    "",
    "## Models and tables",
    "",
    "| Model | Table | Primary key | Composite unique constraints |",
    "| --- | --- | --- | --- |",
    ...models.map((m) => {
      const composite = m.uniqueSets.filter((s) => s.length > 1).map((s) => `(${s.join(", ")})`).join("; ");

      return `| ${m.name} | \`${m.dbName ?? m.name}\` | ${m.primaryKey.join(", ") || "-"} | ${composite || "-"} |`;
    }),
    "",
    "## Enums",
    "",
    "| Enum | Values |",
    "| --- | --- |",
    ...enums.map((e) => `| ${e.name} | ${e.values.join(", ")} |`),
    "",
  ];

  return out.join("\n");
}

const source = readFileSync(SCHEMA_PATH, "utf8");
const fromDmmf = await loadFromDmmf(source);
const schema = fromDmmf ?? parseSchemaText(source);
const markdown = render(schema, fromDmmf ? "Prisma DMMF (`@prisma/internals`)" : "the schema text parser in this script");

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, markdown, "utf8");
process.stdout.write(`ERD written to docs/erd/erd.md (${schema.models.length} models, ${schema.enums.length} enums)\n`);
