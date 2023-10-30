import { DatabaseModule } from "../database/database.js";
import { verifyJWT } from "../utilities/jwtUtils.js"; // Import the JWT verification utility

/**
 * Handle a DELETE request to delete a collector.
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { token, workspaceId, collectorId } = req.body;
        console.log(req.body)
        // Check if the token, workspaceId, or collectorId is missing
        if (!token || !workspaceId || !collectorId) {
            return res.status(400).json({ error: "Token, workspaceId, or collectorId is missing" });
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

        // Find the workspace by workspaceId
        const workspace = await workspacesCollection.findOne({ workspaceId });

        // Check if the workspace is not found
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if the user is a member of the workspace and is the owner or a manager
        if (
            workspace.ownerId !== userUID &&
            !workspace.managers.includes(userUID)
        ) {
            return res.status(403).json({ error: "Forbidden: User is not authorized to delete collectors in this workspace" });
        }

        // Check if the collector exists in the specified workspace
        const collector = await collectorsCollection.findOne({ collectorId, workspaceId });

        // Check if the collector is not found
        if (!collector) {
            return res.status(404).json({ error: "Collector not found" });
        }

        // Delete the collector
        await collectorsCollection.deleteOne({ collectorId, workspaceId });

        // Return a success message
        res.status(200).json({ message: "Collector deleted successfully" });
    } catch (error) {
        console.error("Error while deleting collector:", error);
        res.status(500).json({ error: "Failed to delete collector ❌" });
    }
};
