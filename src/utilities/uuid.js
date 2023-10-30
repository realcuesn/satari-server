// src/utilities/uuid.js
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a unique UUID.
 * @returns {string} A UUID string.
 */
export function generateUUID() {
  return uuidv4();
}
