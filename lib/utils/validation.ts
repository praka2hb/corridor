/**
 * Validation Utilities
 * Helper functions for validating various input types
 */

/**
 * Validates if a string is a valid Solana address
 * Solana addresses are base58 encoded and typically 32-44 characters
 * @param address - The address to validate
 * @returns true if valid Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Solana addresses are base58 encoded, 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

/**
 * Validates if a string is a valid email address
 * @param email - The email to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Detects if input is an email address or Solana address
 * @param input - The input string to check
 * @returns 'email', 'address', or 'unknown'
 */
export function detectInputType(input: string): 'email' | 'address' | 'unknown' {
  if (!input || typeof input !== 'string') {
    return 'unknown';
  }

  const trimmedInput = input.trim();

  // Check if it's an email (contains @)
  if (trimmedInput.includes('@')) {
    return isValidEmail(trimmedInput) ? 'email' : 'unknown';
  }

  // Check if it's a valid Solana address
  if (isValidSolanaAddress(trimmedInput)) {
    return 'address';
  }

  return 'unknown';
}

