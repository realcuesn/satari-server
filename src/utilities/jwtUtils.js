import jwt from "jsonwebtoken";

/**
 * Generate a JWT token for a user with the given userUID and token version.
 *
 * @param {string} userUID - User's unique identifier.
 * @param {number} tokenVersion - Token version.
 * @returns {string} JWT token.
 */
export function generateJWT(userUID, tokenVersion) {
    return jwt.sign({ userUID, tokenVersion }, process.env.JWT_SECRET, { expiresIn: "1d" }); // Customize token expiration as needed.
}

/**
 * Verify a JWT token and return the decoded payload.
 *
 * @param {string} token - JWT token to verify.
 * @returns {object | null} Decoded token payload or null if verification fails.
 */
export function verifyJWT(token) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        return null;
    }
}
