import { DatabaseModule } from "../database/database.js";
import { generateUniqueUserUID } from "../utilities/userUIDGenerator.js";
import { hashPassword } from "../utilities/passwordHash.js";
import { generateJWT } from "../utilities/jwtUtils.js"; // Import the new JWT utility

/**
 * Handle user registration (signup) request. 🚀
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        /** @type {Db} */
        const db = DatabaseModule.getDatabase();

        /** @type {Collection} */
        const usersCollection = db.collection("users"); // Change "users" to your actual collection name

        const { username, email, password } = req.body;
        console.log(req.body)

        // Check if a user with the same username or email already exists. 🧐
        const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });

        if (existingUser) {
            // User with the same username or email already exists.
            if (existingUser.username === username) {
                return res.status(400).json({ error: "Username already exists" });
            } else {
                return res.status(400).json({ error: "Email already exists" });
            }
        }

        // Generate a unique user UID using the utility function. 🆔
        const userUID = await generateUniqueUserUID(usersCollection);

        // Hash the password before storing it using the utility function. 🔐
        const hashedPassword = await hashPassword(password);

        // Extract the client's IP address from the request (if available). 🌐
        const clientIpAddress = req.ip; // This assumes Express is used with 'trust proxy' enabled.
        console.log(req.headers.origin)
        // Create a timestamp for the creation date. 📅
        const createdAt = new Date();

        // Create the user document with the MongoDB-assigned _id, the unique userUID, and the hashed password. 📄
        const user = {
            username,
            email,
            password: hashedPassword, // Store the hashed password.
            ipAddress: clientIpAddress,
            createdAt,
            userUID, // Store the generated unique userUID.
            tokens: [], // Initialize an empty array for JWT tokens.
            tokenVersion: 1, // Initialize the token version.
            avatar: "", // Add the avatar field
            mfa_enabled: false, // Add the MFA enabled field
            global_name: "", // Add the global name (display name) field
            verified: false, // Add the verified (email verification) field
        };

        // Generate an initial JWT token for the user using the new utility function and the token version. 🔄
        const token = generateJWT(userUID, user.tokenVersion);

        // Save the token to the user's document and update the token version. 🔄
        user.tokens.push({ token });
        user.tokenVersion++; // Increment the token version.

        // Insert the user document into the database. 📥
        const result = await usersCollection.insertOne(user);

        // Check if the insertion was acknowledged. ✅
        if (result.acknowledged) {
            res.status(201).json({ message: "User registration successful 🎉", userUID, token });
        } else {
            res.status(500).json({ error: "User registration failed ❌" });
        }
    } catch (error) {
        console.error("Error during user registration:", error);

        // Send a generic error response. ⚠️
        res.status(500).json({ error: "User registration failed ❌" });
    }
};
