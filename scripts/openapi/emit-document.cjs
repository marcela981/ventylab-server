/*
 * Funcionalidad: Emisión del documento OpenAPI sin infraestructura
 * Descripción: Proceso hijo de generate.mjs: registra ts-node (solo transpilación, con los metadatos de decoradores de tsconfig.json) y los alias @/, fija un entorno local ficticio completo (el mismo que usan las pruebas, base de datos en un puerto local cerrado), se ubica en un directorio vacío para que ConfigModule no encuentre .env, crea AppModule en modo preview (sin instanciar proveedores ni conectarse a base de datos, MQTT o IA), construye el documento con buildOpenAPIDocument y lo escribe serializado en la ruta recibida
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
const { mkdtempSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const REPO_ROOT = resolve(__dirname, "..", "..");
const OFFLINE_DATABASE_URL = "postgresql://openapi:openapi@127.0.0.1:9/openapi";

function register() {
  require("ts-node").register({ transpileOnly: true, project: join(REPO_ROOT, "tsconfig.json") });
  require("tsconfig-paths").register({ baseUrl: REPO_ROOT, paths: { "@/*": ["src/*"] } });
  require("reflect-metadata");
}

function applyOfflineEnvironment() {
  const { buildTestEnvironment, completeWithDeclaredDefaults } = require(join(REPO_ROOT, "test", "support", "test-env.ts"));

  Object.assign(process.env, completeWithDeclaredDefaults(buildTestEnvironment({ databaseUrl: OFFLINE_DATABASE_URL, runId: "openapi" })));
}

async function main() {
  const outputPath = process.argv[2];

  if (!outputPath) {
    throw new Error("Usage: node scripts/openapi/emit-document.cjs <output.json>");
  }

  register();
  applyOfflineEnvironment();

  const workDir = mkdtempSync(join(tmpdir(), "ventylab-openapi-"));

  process.chdir(workDir);

  try {
    const { NestFactory } = require("@nestjs/core");
    const { AppModule } = require(join(REPO_ROOT, "src", "app.module.ts"));
    const { buildOpenAPIDocument, serializeOpenAPIDocument } = require(join(REPO_ROOT, "src", "common", "infrastructure", "docs", "openapi-document.ts"));
    const { ROLE_PERMISSIONS } = require(join(REPO_ROOT, "src", "features", "authorization", "domain", "role-permissions.ts"));
    const { USER_ROLE_VALUES } = require(join(REPO_ROOT, "src", "features", "users", "domain", "value-objects", "user-role.ts"));

    const app = await NestFactory.create(AppModule, { preview: true, logger: false, abortOnError: false });

    try {
      const document = buildOpenAPIDocument(app, { roles: { hierarchy: USER_ROLE_VALUES, permissions: ROLE_PERMISSIONS } });

      writeFileSync(outputPath, serializeOpenAPIDocument(document), "utf-8");
    } finally {
      await app.close();
    }
  } finally {
    process.chdir(REPO_ROOT);
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  },
);
