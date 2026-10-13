/*
 * Funcionalidad: Escaneo de secretos del historial git
 * Descripción: Ejecuta gitleaks (imagen Docker fijada por versión y digest, sin instalar nada en el equipo) sobre todo el historial git del repositorio montado en solo lectura con la configuración .gitleaks.toml; lee el reporte JSON en un directorio temporal que borra al terminar y lista cada hallazgo con regla, archivo, línea, commit, fecha y solo los 4 primeros caracteres y la longitud del secreto; termina con código 1 si hay hallazgos y 2 si Docker no está disponible
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const GITLEAKS_IMAGE = "zricethezav/gitleaks:v8.21.2@sha256:0e99e8821643ea5b235718642b93bb32486af9c8162c8b8731f7cbdc951a7f46";
const REPORT_NAME = "gitleaks-report.json";
const VISIBLE_PREFIX = 4;

export function describeFinding(finding) {
  const secret = typeof finding.Secret === "string" ? finding.Secret : "";

  return {
    rule: finding.RuleID,
    file: finding.File,
    line: finding.StartLine,
    commit: typeof finding.Commit === "string" ? finding.Commit.slice(0, 12) : "",
    date: finding.Date,
    secretPreview: `${secret.slice(0, VISIBLE_PREFIX)}… (${secret.length} chars)`,
  };
}

function dockerAvailable() {
  const probe = spawnSync("docker", ["version", "--format", "{{.Server.Version}}"], { encoding: "utf8" });

  return probe.status === 0;
}

function runGitleaks(outputDir) {
  const args = [
    "run", "--rm",
    "-v", `${REPO_ROOT}:/repo:ro`,
    "-v", `${outputDir}:/out`,
    GITLEAKS_IMAGE,
    "git", "/repo",
    "--config", "/repo/.gitleaks.toml",
    "--report-format", "json",
    "--report-path", `/out/${REPORT_NAME}`,
    "--exit-code", "0",
    "--no-banner",
    "--log-level", "warn",
  ];

  return spawnSync("docker", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function main() {
  if (!existsSync(join(REPO_ROOT, ".git"))) {
    console.error("security:secrets needs the git history: run it from a clone with its .git directory");

    return 2;
  }

  if (!dockerAvailable()) {
    console.error("security:secrets needs Docker (the gitleaks image runs in a container; nothing is installed on the host)");

    return 2;
  }

  const outputDir = mkdtempSync(join(tmpdir(), "ventylab-gitleaks-"));

  try {
    const run = runGitleaks(outputDir);

    if (run.status !== 0) {
      console.error(`gitleaks failed (exit ${run.status}):\n${run.stderr || run.stdout}`);

      return 2;
    }

    const findings = JSON.parse(readFileSync(join(outputDir, REPORT_NAME), "utf8")).map(describeFinding);

    console.log(`gitleaks ${GITLEAKS_IMAGE.split("@")[0]}: ${findings.length} finding(s) in the git history`);

    for (const finding of findings) {
      console.log(`- ${finding.rule} | ${finding.file}:${finding.line} | commit ${finding.commit} | ${finding.date} | secret ${finding.secretPreview}`);
    }

    return findings.length === 0 ? 0 : 1;
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
