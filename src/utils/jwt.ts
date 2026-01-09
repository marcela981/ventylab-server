/**
 * JWT Utilities
 * Helper functions for JWT token generation and verification
 */

import jwt, { Secret, SignOptions } from 'jsonwebtoken';

/**
 * JWT Payload Interface
 */
export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

// JWT Configuration
const JWT_SECRET: Secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token
 * @param payload - The data to encode in the token
 * @returns The signed JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as string,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Verify a JWT token
 * @param token - The token to verify
 * @returns The decoded payload if valid
 * @throws Will throw an error if the token is invalid or expired
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

/**
 * Decode a JWT token without verifying
 * @param token - The token to decode
 * @returns The decoded payload or null if invalid
 */
export const decodeToken = (token: string): TokenPayload | null => {
  return jwt.decode(token) as TokenPayload | null;
};

