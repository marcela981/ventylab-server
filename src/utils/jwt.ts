/**
 * JWT Utilities
 * Helper functions for JWT token generation and verification
 */

import jwt, { Secret, SignOptions, Algorithm } from 'jsonwebtoken';

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
 * Convert time string to seconds
 * Supports formats: "7d", "24h", "30m", "60s" or plain number
 */
function parseExpiresIn(value: string): number {
  const match = value.match(/^(\d+)([dhms]?)$/);
  if (!match) {
    return 604800; // Default: 7 days in seconds
  }
  
  const num = parseInt(match[1], 10);
  const unit = match[2] || 's';
  
  switch (unit) {
    case 'd': return num * 86400;
    case 'h': return num * 3600;
    case 'm': return num * 60;
    case 's': 
    default: return num;
  }
}

/**
 * Generate a JWT token
 * @param payload - The data to encode in the token
 * @returns The signed JWT token
 */
export const generateToken = (payload: TokenPayload): string => {
  const expiresInSeconds = parseExpiresIn(JWT_EXPIRES_IN);
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
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

