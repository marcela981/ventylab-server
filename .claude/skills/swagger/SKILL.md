---
name: swagger
description: OpenAPI 3.1 contract of this NestJS backend — DTO and controller decorators, the generated and versioned `openapi/openapi.json` (`npm run openapi:generate`/`openapi:check`), the post-processor that adds the response envelope, standard errors and required access, `@ApiNullableResponse`, `@ApiSchema` names, legacy route deprecation (`@DeprecatedRoute`/`@DeprecatedAlias`, Deprecation/Link headers), the AsyncAPI realtime contract (`openapi/asyncapi.yaml`), e2e response validation (`expectMatchesSpec`), the generated TypeScript client, and the `/api/docs` access rule. Trigger on — adding `@ApiProperty`/`@ApiPropertyOptional`/`@ApiOperation`/`@ApiResponse`/`@ApiTags`/`@ApiBearerAuth`, touching `setup-docs.ts` or `src/common/infrastructure/docs/`, adding a controller, DTO, tag group, Socket.io event or SSE event, deprecating a route, or a failing `openapi:check`/contract test.
---

# Swagger / OpenAPI

The contract is generated from the `@nestjs/swagger` decorators — never hand-write the spec. `buildOpenAPIDocument` (`src/common/infrastructure/docs/openapi-document.ts`) builds it, and the same document is:

- written to `openapi/openapi.json` (versioned) by `npm run openapi:generate`, which boots `AppModule` in Nest preview mode (no providers instantiated, so no database, broker or AI) with a dummy local environment from an empty working directory (`.env` is never read); the file is serialized deterministically (sorted keys, no timestamps);
- served at runtime by `/api/docs-json` (Scalar UI at `/api/docs`); an e2e test asserts both are byte-identical.

`npm run openapi:check` regenerates to a temporary file and fails when the committed file differs (it is a `npm run verify` step, before the tests). After changing a controller or DTO: `npm run openapi:generate`, then `npm run openapi:client` (types in `packages/api-client/src/schema.d.ts`), and commit both.

## Post-processing (`src/common/infrastructure/docs/`)

`openapi-routes.ts` reads each handler's metadata (path, method, `__guards__`, `permissions`, `selfOrPermissions`, `@Throttle`, `@Res()`, `@ApiProduces`, `@RawResponse`, deprecation rules); `openapi-enricher.ts` uses it to complete every operation, so controllers only document what is specific to them:

- **Envelope**: every 2xx JSON response becomes `APIResponseEnvelope` with `data` narrowed to the documented type (`type: X`, `isArray`), or `null` when no type is documented (commands). Handlers with `@Res()` (streams, files) get their `@ApiProduces` media type; controllers whose JSON is not enveloped (health probes) use `@RawResponse()` and must document a type.
- **Errors**: `ErrorResponse` (the global filter's envelope) with shared examples, added as 400 (body, query or path parameters), 401 (JWT or bridge guard), 403 (`@RequirePermissions` or `@AllowSelfOr`), 404 (path parameters), 429 (every route not excluded with `@SkipThrottle`, because `ThrottlerGuard` is global) and 500 (always); documented 4xx/5xx responses without a type get `ErrorResponse` too. Document business statuses (409, 422, 423, 503) on the controller.
- **Access**: `security`, `x-min-role` (`ANONYMOUS`, `SERVER`, or the lowest role holding the permissions), `x-required-permissions`, `x-self-or-permissions` and a "Required access" line in the description, derived from the guards and the role → permission map passed in by `main.ts`.
- **operationId**: the method name; aliased paths get `Alias<n>` and names repeated across controllers get the controller prefix.
- **OpenAPI 3.1**: `openapi-31.ts` converts `nullable` into `"null"` types or `anyOf` with `{ type: "null" }`.

`test/openapi/openapi-completeness.spec.ts` (`npm run test:contract`) fails when an operation lacks a 2xx schema, security, `x-min-role`, the standard errors or a unique operationId, when `x-min-role` disagrees with the e2e authorization matrix, or when two DTO classes share a schema name.

## Access to `/api/docs` and `/api/docs-json`

Open outside production (`NODE_ENV !== "production"`). In production they answer only to a request whose `Authorization: Bearer` access token verifies with role `ADMIN` (browser navigation sends no bearer header, so administrators fetch `/api/docs-json` with the header or use a non-production build). `SWAGGER_ALLOWED_IPS`, when it lists addresses, also restricts the source IP in every environment (`*` or empty means no IP restriction). Every rejection answers `404`, not `403`, to avoid leaking route existence.

## Tags

`x-tagGroups` (a Scalar extension splitting the sidebar into sections) lives in `openapi-document.ts` (`TAG_GROUPS`). **Adding a new tag**: pick its group, add the sentence-case string to that array, and use the identical string in `@ApiTags("...")` — every tag **must** appear in exactly one group, or the endpoint renders ungrouped in the Scalar sidebar.

Keep method names unique app-wide where possible; collisions are prefixed automatically, but the prefixed ID is less readable for client generators.

## DTO decorators

**Request DTOs** — `@ApiProperty` (required) / `@ApiPropertyOptional` (optional), always with `description` + `example`:

```typescript
@ApiProperty({ description: "User's full name", example: "John Doe", minLength: 2 })
@IsString({ message: i18nValidationMessage("users.name_must_be_string") })
@MinLength(2, { message: i18nValidationMessage("users.name_min_length") })
public name: string;
```

Enum fields: `enum: USER_TYPE_VALUES` in the decorator, `@IsIn([...USER_TYPE_VALUES])` for runtime validation — **type the field as `string`**, not the domain value alias; the cast to the domain type happens in the controller (see `presentation-layer` skill). Never hardcode an enum array — always the exported constant.

**Response DTOs** use `@ApiProperty` with no validators (serialization only). A property typed `unknown` documents its possible shapes with `oneOf` (otherwise it becomes `type: object`). Two DTO classes with the same name in different features collide in `components.schemas`: give one of them `@ApiSchema({ name: "<Feature><Name>DTO" })`.

**Query DTOs** extending `ListQueryDTO` (see `pagination` skill) add `@ApiPropertyOptional` per filter, same enum rule as above.

## Controller decorators

Class level: `@ApiTags("Users")` + `@ApiBearerAuth("JWT-auth")` (omit the bearer decorator on public endpoints).

Method level:

```typescript
@Get()
@ApiOperation({ summary: "Get all users", description: "Retrieves a paginated list of users with optional filters" })
@ApiResponse({ status: 200, description: "Users retrieved successfully", type: UserDTO, isArray: true })
@ApiResponse({ status: 401, description: "Unauthorized" })
public async getAll(...) { }
```

- Queries (GET): document 200 with the response DTO type (the `data` of the envelope), `isArray: true` for lists. When `data` may be `null` ("my attempt, if any"), use `@ApiNullableResponse({ status, description, type })` (`src/common/presentation/decorators/`). When items can take one of several DTO shapes, document `schema: { type: "array", items: { anyOf: [{ $ref: getSchemaPath(A) }, { $ref: getSchemaPath(B) }] } }` with `@ApiExtraModels(A, B)`.
- Commands (POST/PATCH/DELETE): document 201/200 with no response type (body is `null`), plus the business-error statuses that actually apply (409 conflict, 422, 423...). The post-processor adds 400/401/403/404/429/500 from the route metadata; documenting them on the controller only adds a more specific description.

## Legacy routes

A route kept only for compatibility is marked, never removed while it has consumers: `@DeprecatedAlias({ alias: "api/old-orders", successor: "api/orders" })` on a controller registered under both paths, or `@DeprecatedRoute({ successor: "/api/orders/:id/status", successorParams?, successorMethod? })` on one handler. `DeprecationHeadersInterceptor` adds `Deprecation: @<epoch seconds>` (RFC 9745) and, when the successor URL can be filled from the request parameters, `Link: <successor>; rel="successor-version"`; the operation becomes `deprecated: true` with `x-successor`. Responses are unchanged. Keep the inventory in `docs/api/legacy-endpoints.md`.

## Realtime and SSE contract

Socket.io events (server → client, with room and payload) and client messages, plus the server-sent-event streams (`delta`, `done`, `error`), are documented in `openapi/asyncapi.yaml` (AsyncAPI 3.0; payloads reuse `openapi.json` schemas by `$ref` when a DTO has the same shape) and typed in `contracts/websocket-events.contracts.ts`. `test/openapi/asyncapi-events.spec.ts` scans `src/` for emitted and received event names and fails when one is missing from either file or when the AsyncAPI documents an event nothing emits. A new event: add the message (and its channel and operation), then the `ServerToClientEvents`/`ClientToServerEvents` entry.

## Response validation in e2e tests

`test/support/openapi-validator.ts` validates a response against `openapi/openapi.json` with Ajv (JSON Schema 2020-12): `expectMatchesSpec(res, method, path)` throws when the status is not documented for the operation or the JSON body does not match its schema; `contractViolations(...)` returns the messages instead. The authorization matrix validates every 2xx JSON response it receives. A mismatch is a contract defect: fix the decorators when the response is right, report a bug when the response is wrong.

## Rules

- Every field needs `description` + `example` — no bare `@ApiProperty()`.
- Never hand-edit `openapi/openapi.json` or `packages/api-client/src/schema.d.ts`; regenerate them.
- Don't return data in mutation responses, don't expose entities directly — always the response DTO.
- Run `npm run openapi:generate`, `npm run openapi:client` and `npm run test:contract` after adding or changing a tag, endpoint, DTO or realtime event.
