<!--
Funcionalidad: Guía del paquete de tipos del cliente de la API
Descripción: Explica qué contiene @ventylab/api-client, cómo se regenera desde openapi/openapi.json y cómo se usan sus tipos
Versión: 1.0
Autor: Marcela Mazo Castro
Proyecto: VentyLab
Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
Institución: Universidad del Valle
Contacto: marcela.mazo@correounivalle.edu.co
-->
# @ventylab/api-client

Types only: `src/schema.d.ts` describes every route, request and response of the VentyLab HTTP API. It is generated from `openapi/openapi.json` with [openapi-typescript](https://openapi-ts.dev); never edit it by hand.

## Regenerate

From the server repository root, after changing a controller or DTO:

```bash
npm run openapi:generate   # rebuilds openapi/openapi.json from the decorators
npm run openapi:client     # rebuilds packages/api-client/src/schema.d.ts
```

`npm run openapi:check` (also a step of `npm run verify`) fails when `openapi/openapi.json` is out of date.

## Use

```ts
import type { components, operations, paths } from "@ventylab/api-client";

type UserDTO = components["schemas"]["UserDTO"];
type CurrentUserResponse = paths["/api/users/me"]["get"]["responses"][200]["content"]["application/json"];
type CurrentUserData = CurrentUserResponse["data"];
```

Every JSON response is the `APIResponseEnvelope` (`success`, `message`, `data`, `code`, `timestamp`, `traceId`, `pagination`); errors use `ErrorResponse`. Operations marked `deprecated` carry an `x-successor`; the realtime and server-sent events contract is `openapi/asyncapi.yaml`.
