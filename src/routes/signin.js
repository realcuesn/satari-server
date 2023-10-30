import { DatabaseModule } from "../database/database.js";
import { comparePassword } from "../utilities/passwordHash.js";
import { generateJWT } from "../utilities/jwtUtils.js"; // Import the new JWT utility

/**
 * Handle user login (signin) request. 🚀
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(req.body)
        console.log(`--host:`,req.get("host"))
        /** @type {Db} */
        const db = DatabaseModule.getDatabase();

        /** @type {Collection} */
        const usersCollection = db.collection("users"); // Change "users" to your actual collection name

        // Find the user by username 🕵️‍♂️
        const user = await usersCollection.findOne({ username });

        if (!user) {
            // User not found
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Compare the provided password with the hashed password in the database 🔐
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            // Password is invalid
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // Generate a new JWT token using the new utility function and the user's existing token version. 🔄
        const token = generateJWT(user.userUID, user.tokenVersion);

        // Push the new token into the user's tokens array without changing the token version. 🔄
        user.tokens.push({ token });

        // Update the user document with the new token. 🔄
        const updateResult = await usersCollection.updateOne(
            { userUID: user.userUID },
            { $set: { tokens: user.tokens } }
        );

        if (updateResult.modifiedCount === 1) {
            // Token added successfully
            res.status(200).json({ message: "Login successful 🎉", userUID: user.userUID, token });
        } else {
            res.status(500).json({ error: "Login failed ❌" });
        }
    } catch (error) {
        console.error("Error during user login:", error);

        // Send a generic error response. ⚠️
        res.status(500).json({ error: "Login failed ❌" });
    }
};
