import { DatabaseModule } from "../database/database.js";
import { verifyJWT } from "../utilities/jwtUtils.js"; // Import the JWT verification utility

/**
 * Handle user login (signin) request with a token. 🚀
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: "Token is missing" });
        }

        // Verify the token using the JWT verification utility. 🔒
        const decodedToken = verifyJWT(token);

        if (!decodedToken) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userUID = decodedToken.userUID;

        /** @type {Db} */
        const db = DatabaseModule.getDatabase();

        /** @type {Collection} */
        const usersCollection = db.collection("users"); // Change "users" to your actual collection name

        // Find the user by userUID 🕵️‍♂️
        const user = await usersCollection.findOne({ userUID });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove the token information from the user document.
        const userWithoutTokenInfo = { ...user };
        delete userWithoutTokenInfo.tokens;
        delete userWithoutTokenInfo.password; // Remove the password as well

        // Respond with the user document excluding the token and password information.
        res.status(200).json({ ...userWithoutTokenInfo });
    } catch (error) {
        console.error("Error during user login with token:", error);

        // Handle specific errors and provide appropriate error responses.
        if (error instanceof SyntaxError) {
            // JSON parsing error
            res.status(400).json({ error: "Invalid JSON in the request body" });
        } else {
            res.status(500).json({ error: "Login with token failed ❌" });
        }
    }
};
