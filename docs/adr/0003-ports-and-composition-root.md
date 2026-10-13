<!--
  Funcionalidad: ADR 0003 - Puertos y raíz de composición
  Descripción: Registra el uso de puertos por funcionalidad enlazados a adaptadores en src/composition para evitar dependencias directas entre funcionalidades
  Versión: 1.0
  Autor: Marcela Mazo Castro
  Proyecto: VentyLab
  Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
  Institución: Universidad del Valle
  Contacto: marcela.mazo@correounivalle.edu.co
-->

# ADR 0003: Ports and a composition root

- **Status:** Accepted
- **Date:** 2026-10-12 (documented after the fact)

## Context

Some features need values or data owned by a feature they must not import. The clearest case: admin-editable runtime values (AI timeouts and quotas, reservation limits, ventilator intervals, grading weights) are owned by `platform-settings`, but if every consumer imported it, `platform-settings` would become a hub coupled to everything, and consumers could not be tested or booted without it. Analytics has the same problem with the notifications unread counter.

## Decision

- Each consumer feature declares its **own port** (interface + DI token) in its `application/` layer and reads it on every call.
- `src/composition/` is the **composition root**: `src/composition/composition.module.ts` is a `@Global()` module that registers `PlatformSettingsModule` and binds seven ports to adapters over `PlatformSettingsFacade`: `AI_SETTINGS_PROVIDER_TOKEN`, `AI_PRICE_TABLE_TOKEN`, `RESERVATION_SETTINGS_TOKEN`, `VENTILATOR_TELEMETRY_SETTINGS_TOKEN`, `VENTILATOR_COMMANDS_SETTINGS_TOKEN`, `SIMULATION_SESSION_SETTINGS_TOKEN`, `EVALUATION_GRADING_CONFIG_TOKEN`.
- Adapters live in `src/composition/adapters/` (`ai-settings.adapters.ts`, `feature-settings.adapters.ts`); editable fields are getters that read the facade on each access, so changes apply without a restart.
- Defaults come from each feature's config reader (`src/composition/platform-setting-defaults.ts`); a default outside the registry's hard limits is logged and replaced by the closest valid value instead of stopping the boot.
- `src/composition/analytics-ports.module.ts` binds `UNREAD_NOTIFICATIONS_COUNTER_TOKEN` to `NotificationsFacade.countUnread`, so analytics never imports notifications.
- Common ports (audit recorder, realtime publisher, event bus, access-token verifier) are declared under `src/common/application/` and implemented by global modules.

## Alternatives considered

- **Direct imports of `PlatformSettingsFacade` in every consumer:** fewer files, but creates a dependency hub and makes each consumer depend on the settings table at boot and in tests.
- **Environment variables only:** no runtime editing by administrators.
- **A port per consumer implemented inside `platform-settings`:** inverts the dependency the wrong way (the provider would know every consumer).

## Consequences

- Consumers are unit-tested with plain objects implementing their port; `src/composition/composition.module.spec.ts` checks that the app boots without the `platform_settings` table and that live updates apply.
- `src/composition/production-bindings.spec.ts` fails when production binds a Noop/Stub/Fake/InMemory/Mock outside the documented fallbacks, or when a production file answers 501.
- The composition root is the one place that knows several features at once; it must stay free of business logic.
