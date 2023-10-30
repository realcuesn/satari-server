import { DatabaseModule } from "../database/database.js";
import { generateUUID } from "../utilities/uuid.js";
import { verifyJWT } from "../utilities/jwtUtils.js"; // Import the JWT verification utility

/**
 * Validate collector data against the expected schema.
 *
 * @param {object} collectorData - The collector data to validate.
 * @returns {boolean} - True if the data is valid, false otherwise.
 */
function validateCollectorData(collectorData) {
    // Define the expected structure of the collector data
    const expectedKeys = [
        "workspaceId",
        "name",
        "sourceType",
        "allowedDomains",
        "formStructure",
    ];

    // Check if all expected keys are present
    for (const key of expectedKeys) {
        if (!(key in collectorData)) {
            return false; // Missing required field
        }
    }

    // Check the data types of specific fields
    if (typeof collectorData.workspaceId !== "string" ||
        typeof collectorData.name !== "string" ||
        typeof collectorData.sourceType !== "string" ||
        !Array.isArray(collectorData.allowedDomains) ||
        typeof collectorData.formStructure !== "object") {
        return false; // Data type mismatch
    }

    // Ensure that there is at least one field defined in formStructure
    if (Object.keys(collectorData.formStructure.fields).length === 0) {
        return false; // No fields defined
    }

    // Ensure that each form field in formStructure has a 'name' and 'type' property
    for (const field of Object.values(collectorData.formStructure.fields)) {
        if (typeof field.name !== "string" ||
            !(field.type === "string" || field.type === "number" || field.type === "array")) {
            return false; // Invalid form field or type
        }
    }

    return true; // Data is valid
}

/**
 * Handle a POST request to create a new collector.
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { token, collectorData } = req.body;

        // Check if the token is missing
        if (!token) {
            return res.status(400).json({ error: "Token is missing" });
        }

        // Verify the token using the JWT verification utility. 🔒
        const decodedToken = verifyJWT(token);

        // Check if the token is invalid
        if (!decodedToken) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userUID = decodedToken.userUID;

        /** @type {Db} */
        const db = DatabaseModule.getDatabase();

        /** @type {Collection} */
        const collectorsCollection = db.collection("collectors"); // Change to your actual collection name
        /** @type {Collection} */
        const workspacesCollection = db.collection("workspaces"); // Change to your actual collection name
        /** @type {Collection} */
        const usersCollection = db.collection("users"); // Change "users" to your actual collection name

        // Find the user by userUID 🕵️‍♂️
        const user = await usersCollection.findOne({ userUID });

        // Check if the user is not found
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Validate the collector data against the expected schema
        if (!validateCollectorData(collectorData)) {
            return res.status(400).json({ error: "Invalid collector data" });
        }

        // Extract the workspaceId from collectorData
        const { workspaceId } = collectorData;

        // Find the workspace based on the workspaceId
        const workspace = await workspacesCollection.findOne({ workspaceId });

        // Check if the workspace is not found
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if the user is not the owner or a manager of the workspace
        if (!(workspace.ownerId === userUID || workspace.managers.includes(userUID))) {
            return res.status(403).json({ error: "Forbidden: User does not have permission to create collectors" });
        }

        // Check if the workspace already has 10 forms
        const existingFormsCount = await collectorsCollection.countDocuments({ workspaceId });

        // Check if the maximum limit of 10 forms for this workspace is reached
        if (existingFormsCount >= 10) {
            return res.status(400).json({ error: "Maximum limit of 10 forms for this workspace reached" });
        }

        // Generate a unique collectorId for the new collector
        const collectorId = generateUUID();

        // Add the collectorId to the collectorData
        collectorData.collectorId = collectorId;

        // Insert the new collector data into the "Collectors" collection
        const insertResult = await collectorsCollection.insertOne(collectorData);

        // Check if the collector was inserted successfully
        if (insertResult.acknowledged) {
            // Collector created successfully
            res.status(201).json({ message: "Collector created successfully", collectorId });
        } else {
            // Failed to create the collector
            res.status(500).json({ error: "Failed to create the collector" });
        }
    } catch (error) {
        console.error("Error during collector creation:", error);

        // Handle specific errors and provide appropriate error responses.
        if (error instanceof SyntaxError) {
            // JSON parsing error
            res.status(400).json({ error: "Invalid JSON in the request body" });
        } else {
            res.status(500).json({ error: "Collector creation failed ❌" });
        }
    }
};
