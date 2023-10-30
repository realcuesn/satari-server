import { generateUUID } from "./uuid.js"; // Import the UUID generation function

/**
 * Generate a unique userUID.
 *
 * @param {Collection} usersCollection - MongoDB collection for users.
 * @returns {Promise<string>} A unique userUID.
 */
export async function generateUniqueUserUID(usersCollection) {
  let userUID = generateUUID();

  // Check if the generated userUID is unique; if not, regenerate it
  while (await usersCollection.findOne({ userUID })) {
    userUID = generateUUID();
  }

  return userUID;
}
