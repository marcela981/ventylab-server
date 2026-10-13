---
name: authorization
description: Role-based access control (RBAC) and session security for this backend — fixed roles STUDENT < TEACHER < ADMIN, the code-defined role → permission map, JWT-embedded permissions, `PermissionsGuard` + `@RequirePermissions`, `SelfOrPermissionGuard` + `@AllowSelfOr`, the immutable superadmin (`SUPERADMIN_EMAIL`, startup bootstrap, DB trigger), refresh-token revocation (`refreshTokensRevokedAt` vs `iat`), inactive users, auth-route and anonymous-route throttling. Trigger on — adding/using `@RequirePermissions(...)`, `PermissionsGuard`, a new entry in the permission catalog or `ROLE_PERMISSIONS`, role or status changes, `hasRoleAtLeast`, `isSuperadmin`, `SUPERADMIN_EMAIL_TOKEN`, `refreshTokensRevokedAt`, `UserInactiveError`, reading `JwtPayload.permissions`, `@Throttle` on auth routes, `@SkipThrottle`.
---

# Authorization (RBAC)

Code-defined design — **no DB query per request**:

| Concern                     | Where it lives                                                                 |
| --------------------------- | ------------------------------------------------------------------------------ |
| Permission names            | `src/features/authorization/domain/permission-catalog.ts`                      |
| Roles                       | `UserRole` Prisma enum + `UserRoleValue` (`STUDENT`, `TEACHER`, `ADMIN`)        |
| Role → permissions          | `ROLE_PERMISSIONS` in `src/features/authorization/domain/role-permissions.ts`  |
| User → role                 | `users.role` column (one role per user)                                        |
| Permissions at request time | JWT payload, `permissions: string[]` (resolved when the token is signed)       |

`GET /api/authorization/permissions` and `GET /api/authorization/roles` expose the catalog and the role map read-only.

## Permission catalog

Single source of truth, pattern `resource:action`:

```typescript
export type PermissionValue = "resource_a:read" | "resource_a:create" | "resource_b:delete";

export const PERMISSION_CATALOG: readonly PermissionValue[] = ["resource_a:read", "resource_a:create", "resource_b:delete"];
```

**Adding a permission**: add the literal to `PermissionValue` and to `PERMISSION_CATALOG`, grant it to the roles that need it in `ROLE_PERMISSIONS`, use it in `@RequirePermissions("resource:action")`, update this skill.

## Roles

Three fixed roles with a strict hierarchy `STUDENT < TEACHER < ADMIN`. Compare ranks with `hasRoleAtLeast(actual, required)` (`src/features/users/domain/services/role-hierarchy.ts`), never with string equality chains. `ROLE_PERMISSIONS` maps each role to its permissions: `ADMIN` holds the full `PERMISSION_CATALOG`; `STUDENT` and `TEACHER` hold explicit lists. `resolveRolePermissions(role)` returns the deduplicated list.

Role and status changes go through the users feature (`PATCH /api/users/:id/role` with `users:update_role`, `PATCH /api/users/:id/status` with `users:update_status`). A role change runs in one transaction: it updates the role, removes memberships that no longer fit the new role, sets `refreshTokensRevokedAt`, records an audit entry through `IAuditRecorder`, and after commit emits a realtime event to the user. Callers cannot change their own role or status.

## JWT payload

`LoginUseCase`, `RefreshTokenUseCase`, Google sign-in and the server-to-server bridge build the payload from the current user with one shared helper:

```typescript
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}
```

Permissions are resolved **at sign time**, not per request. A user whose role changes receives the new permissions on the next sign-in or refresh.

## Enforcing on routes

```typescript
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("users:update")
public async update(...): Promise<APIResponse<null>> { ... }
```

`PermissionsGuard` must always be combined with `JwtAuthGuard` — it relies on the JWT guard having already validated the token and populated `request.user`. `@RequirePermissions` accepts one or more `PermissionValue`s — all must be present (AND). Guard decision order: no `@RequirePermissions` on the handler/class → grant; no `request.user` → `UnauthorizedError` (401); all required permissions present → grant; otherwise → `ForbiddenPermissionError` (403). No role bypasses the check; `ADMIN` passes because it holds every permission.

Apply the guard pair at class level (all routes share it) or per-method (selective) — either is fine, pick based on how many routes need it.

## Self-or-permission routes

For routes a user may call on their own record, or that someone else may call when holding a permission, combine `SelfOrPermissionGuard` with `@AllowSelfOr(paramKey, ...permissions)`:

```typescript
@Get(":id/summary")
@UseGuards(JwtAuthGuard, SelfOrPermissionGuard)
@AllowSelfOr("id", "accounts:read")
public async getSummary(@Param("id") id: string): Promise<APIResponse<AccountSummaryDTO>> { ... }
```

Guard decision order: no `@AllowSelfOr` metadata → grant; no `request.user` → `UnauthorizedError` (401); `request.params[paramKey] === user.sub` → grant; all listed permissions present → grant; otherwise → `ForbiddenPermissionError` (403). Like `PermissionsGuard`, it must run after `JwtAuthGuard`. Files: `src/features/auth/presentation/guards/self-or-permission.guard.ts`, `src/features/auth/presentation/decorators/allow-self-or.decorator.ts`.

## Immutable superadmin

One configured account (`SUPERADMIN_EMAIL`) is an `ADMIN` whose role and active status can never change.

- Check it with `isSuperadmin(email, superadminEmail)` from `src/features/users/domain/services/is-superadmin.ts` (trimmed, case-insensitive). Inject the address with `@Inject(SUPERADMIN_EMAIL_TOKEN) private readonly _superadminEmail: string` (exported by `UsersModule`).
- At startup an `OnApplicationBootstrap` service forces that account to `ADMIN` and active when it exists. Account creation (local registration or Google) assigns `ADMIN` to that email and `STUDENT` to everyone else.
- Role changes throw `SuperadminRoleImmutableError` (403) and status changes throw `SuperadminStatusImmutableError` (403), whoever the caller is, including the superadmin.
- The database enforces the same rule: the `protect_superadmin()` trigger on `users` reads the address from `app_settings` (`key = 'superadmin_email'`) and rejects demotion or deactivation; the error is mapped to 403.

## Session security

- **Refresh revocation** keeps the token format unchanged: `users.refreshTokensRevokedAt` is set on role change and deactivation, and `/api/auth/refresh` rejects a refresh token whose `iat` is not after it (`RefreshTokenRevokedError`, 401). The verifier exposes `iat` for this check.
- **Inactive users** (`users.isActive = false`) are rejected with `UserInactiveError` (403) on every token-issuing path: local login, Google sign-in, refresh and the bridge. `JwtAuthGuard` stays stateless — it only verifies the access token signature and expiry, so a deactivated user keeps access until the short-lived access token expires.
- **Password-less accounts** (created through Google) get `PasswordLoginNotAvailableError` (400) on local login; an unknown email keeps the generic invalid-credentials error.
- **Throttling**: `ThrottlerGuard` is global (`APP_GUARD`) with `THROTTLE_TTL`/`THROTTLE_LIMIT`; registration, sign-in, refresh and bridge routes override it with a stricter `@Throttle({ default: { limit, ttl } })` and named constants in the controller. Every route reachable without authentication stays throttled: `@SkipThrottle` on an anonymous route needs an entry with its reason in the exemption list of `test/e2e/security/rate-limiting.e2e-spec.ts` (only the health probes), which fails otherwise. A throttled request answers 429 `common.too_many_requests` with `Retry-After`.

## Module wiring

`AuthModule` is `@Global()` and imports `UsersModule`; it exports `TOKEN_GENERATOR_TOKEN`, `ACCESS_TOKEN_VERIFIER_TOKEN`, `JwtAuthGuard`, `OptionalJwtAuthGuard`, `PermissionsGuard` and `SelfOrPermissionGuard`. Because it is global, a feature module can use the guards without importing it, and `UsersModule` never imports `AuthModule`, so there is no module cycle and no `forwardRef()`. Auth reads users through `UsersFacade`; the password hash is the one read that goes through the users repository token.
