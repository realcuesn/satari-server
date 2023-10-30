import bcrypt from "bcrypt";

/**
 * Hash a password using bcrypt.
 *
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} The hashed password.
 */
export async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds: 10
  return hashedPassword;
}

/**
 * Compare a plain password with a hashed password.
 *
 * @param {string} plainPassword - The plain password to compare.
 * @param {string} hashedPassword - The hashed password to compare against.
 * @returns {Promise<boolean>} True if the passwords match, false otherwise.
 */
export async function comparePassword(plainPassword, hashedPassword) {
  const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);
  return isPasswordValid;
}
