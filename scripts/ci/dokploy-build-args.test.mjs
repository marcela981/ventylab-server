/*
 * Funcionalidad: Pruebas del sello de GIT_SHA y BUILD_DATE en Dokploy
 * Descripción: Verifica con node:test que stampBuildArgs reemplaza o agrega GIT_SHA y BUILD_DATE conservando los demás argumentos, que rechaza valores inválidos y que el cuerpo de application.saveEnvironment conserva env, buildSecrets y createEnvFile y se niega a guardar si falta alguno de esos campos
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildSaveEnvironmentPayload, stampBuildArgs } from "./dokploy-build-args.mjs";

const STAMP = { sha: "3f2c1ab9d0e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8", builtAt: "2026-11-04T18:30:00Z" };

describe("stampBuildArgs", () => {
  it("adds both arguments to an empty field", () => {
    assert.equal(stampBuildArgs(null, STAMP), `GIT_SHA=${STAMP.sha}\nBUILD_DATE=${STAMP.builtAt}`);
    assert.equal(stampBuildArgs("", STAMP), `GIT_SHA=${STAMP.sha}\nBUILD_DATE=${STAMP.builtAt}`);
  });

  it("replaces stale values and keeps every other line in order", () => {
    const existing = "NODE_VERSION=22\r\nGIT_SHA=old\n# comment\n BUILD_DATE = 2020-01-01T00:00:00Z\nFEATURE=on\n\n";
    assert.equal(stampBuildArgs(existing, STAMP), `NODE_VERSION=22\n# comment\nFEATURE=on\nGIT_SHA=${STAMP.sha}\nBUILD_DATE=${STAMP.builtAt}`);
  });

  it("does not touch keys that only share a prefix", () => {
    assert.match(stampBuildArgs("GIT_SHA_SHORT=abc", STAMP), /^GIT_SHA_SHORT=abc\n/);
  });

  it("rejects a value that is not a commit id or a UTC date", () => {
    assert.throws(() => stampBuildArgs("", { ...STAMP, sha: "main; rm -rf /" }), /GIT_SHA/);
    assert.throws(() => stampBuildArgs("", { ...STAMP, builtAt: "yesterday" }), /BUILD_DATE/);
  });
});

describe("buildSaveEnvironmentPayload", () => {
  const application = { applicationId: "app-1", env: "DATABASE_URL=x", buildArgs: "GIT_SHA=old", buildSecrets: null, createEnvFile: false, name: "api" };

  it("preserves env, build secrets and the env file option", () => {
    assert.deepEqual(buildSaveEnvironmentPayload(application, "app-1", STAMP), {
      applicationId: "app-1",
      env: "DATABASE_URL=x",
      buildArgs: `GIT_SHA=${STAMP.sha}\nBUILD_DATE=${STAMP.builtAt}`,
      buildSecrets: null,
      createEnvFile: false,
    });
  });

  it("refuses to save when a preserved field is missing, without echoing values", () => {
    const { buildSecrets: _omitted, ...older } = application;
    assert.throws(() => buildSaveEnvironmentPayload(older, "app-1", STAMP), (error) => {
      assert.match(error.message, /missing buildSecrets/);
      assert.doesNotMatch(error.message, /DATABASE_URL/);
      return true;
    });
    assert.throws(() => buildSaveEnvironmentPayload(null, "app-1", STAMP), /did not return an object/);
  });
});
