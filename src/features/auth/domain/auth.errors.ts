/*
 * Funcionalidad: Errores de autenticación
 * Descripción: Errores de dominio de credenciales, tokens, revocación, usuario inactivo, inicio de sesión con Google, permisos y secreto del puente de NextAuth
 * Versión: 1.1
 * Autor: Marcela Mazo Castro
 * Proyecto: VentyLab
 * Tesis: Desarrollo de una aplicación web para la enseñanza de mecánica ventilatoria que integre un sistema de retroalimentación usando modelos de lenguaje
 * Institución: Universidad del Valle
 * Contacto: marcela.mazo@correounivalle.edu.co
 */
import { DomainError } from "@/common/domain/errors/domain-error";
import { SkipLogError } from "@/common/presentation/decorators/skip-log-error.decorator";
import { SkipSaveErrorLog } from "@/common/presentation/decorators/skip-save-error-log.decorator";

export class InvalidCredentialsError extends DomainError {
  public constructor() {
    super("Invalid credentials", "auth.invalid_credentials");
  }
}

export class UnauthorizedError extends DomainError {
  public constructor() {
    super("Unauthorized", "auth.unauthorized");
  }
}

@SkipLogError()
@SkipSaveErrorLog()
export class TokenExpiredError extends DomainError {
  public constructor() {
    super("Token expired", "auth.token_expired");
  }
}

export class InvalidTokenError extends DomainError {
  public constructor() {
    super("Invalid token", "auth.invalid_token");
  }
}

@SkipLogError()
@SkipSaveErrorLog()
export class RefreshTokenExpiredError extends DomainError {
  public constructor() {
    super("Refresh token expired", "auth.refresh_token_expired");
  }
}

export class RefreshTokenInvalidError extends DomainError {
  public constructor() {
    super("Invalid refresh token", "auth.refresh_token_invalid");
  }
}

export class ForbiddenPermissionError extends DomainError {
  public constructor() {
    super("Forbidden", "auth.forbidden");
  }
}

export class InvalidBridgeSecretError extends DomainError {
  public constructor() {
    super("Missing or invalid NextAuth bridge secret", "auth.invalid_bridge_secret");
  }
}

@SkipLogError()
@SkipSaveErrorLog()
export class RefreshTokenRevokedError extends DomainError {
  public constructor() {
    super("Refresh token revoked", "auth.refresh_token_revoked");
  }
}

export class UserInactiveError extends DomainError {
  public constructor() {
    super("User account is inactive", "auth.user_inactive");
  }
}

export class PasswordLoginNotAvailableError extends DomainError {
  public constructor() {
    super("This account uses Google sign-in; log in with Google", "auth.password_login_not_available");
  }
}

export class GoogleSignInNotConfiguredError extends DomainError {
  public constructor() {
    super("Google sign-in is not configured", "auth.google_sign_in_not_configured");
  }
}

export class InvalidGoogleTokenError extends DomainError {
  public constructor() {
    super("Invalid Google ID token", "auth.invalid_google_token");
  }
}

export class GoogleEmailNotVerifiedError extends DomainError {
  public constructor() {
    super("Google email is not verified", "auth.google_email_not_verified");
  }
}

export class EmailDomainNotAllowedError extends DomainError {
  public constructor() {
    super("Email domain is not allowed", "auth.email_domain_not_allowed");
  }
}
