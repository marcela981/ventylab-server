/*
 * Funcionalidad: Puerto IAiSettingsProvider
 * Descripción: Contrato de la configuración del gateway de IA: cadena de proveedores, modelo, tiempo límite, tokens y temperatura por caso de uso; cortocircuito; reintento; cuotas por rol y caso de uso; ajustes del tutor y tabla de precios por proveedor y modelo
 * Versión: 1.0
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { type AiUseCaseValue } from "@/features/ai/domain/value-objects/ai-use-case";

export const AI_SETTINGS_PROVIDER_TOKEN: unique symbol = Symbol("AI_SETTINGS_PROVIDER_TOKEN");

export interface AiUseCaseSettings {
  readonly providerChain: readonly string[];
  readonly models: Readonly<Record<string, string>>;
  readonly timeoutMs: number;
  readonly maxOutputTokens: number;
  readonly temperature: number;
}

export interface AiBreakerSettings {
  readonly failureThreshold: number;
  readonly openSeconds: number;
}

export interface AiQuotaLimit {
  readonly requestsPerDay?: number;
  readonly tokensPerDay?: number;
}

export interface AiTutorSettings {
  readonly historyWindow: number;
  readonly contextTokenBudget: number;
}

export interface AiModelPrice {
  readonly inputPer1kUsd: number;
  readonly outputPer1kUsd: number;
}

export interface IAiSettingsProvider {
  getUseCaseSettings(useCase: AiUseCaseValue): AiUseCaseSettings;
  getBreakerSettings(): AiBreakerSettings;
  getRetryDelayMs(): number;
  getQuota(role: string, useCase: AiUseCaseValue): AiQuotaLimit | undefined;
  getTutorSettings(): AiTutorSettings;
  getPrice(provider: string, model: string): AiModelPrice | undefined;
}
