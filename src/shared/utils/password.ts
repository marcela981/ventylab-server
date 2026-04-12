/**
 * Password Utilities
 * Helper functions for password hashing and verification
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** Hash a password using bcrypt */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

/** Compare a plain text password with a hashed password */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
