/**
 * Auth Service - Business logic for authentication
 * TODO: Extract business logic from controller in future refactoring phase
 */

import { prisma } from '../../shared/infrastructure/database';
import { hashPassword, comparePassword } from '../../shared/utils/password';
import { generateToken } from '../../shared/utils/jwt';

// TODO: Move business logic from auth.controller.ts here
export class AuthService {
  // Placeholder for future extraction
}
