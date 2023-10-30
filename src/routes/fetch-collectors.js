import { DatabaseModule } from "../database/database.js";
import { verifyJWT } from "../utilities/jwtUtils.js"; // Import the JWT verification utility

/**
 * Handle a GET request to retrieve all collectors in a workspace.
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { token, workspaceId } = req.body;
        console.log(token)

        // Check if the token is missing or the workspaceId is missing
        if (!token || !workspaceId) {
            return res.status(400).json({ error: "Token or workspaceId is missing" });
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

        // Check if the user is a member of the workspace
        if (
            workspace.ownerId !== userUID &&
            !workspace.managers.includes(userUID) &&
            !workspace.teamMembers.includes(userUID)
        ) {
            return res.status(403).json({ error: "Forbidden: User is not a member of this workspace" });
        }

        // Find all collectors in the specified workspace
        const collectors = await collectorsCollection.find({ workspaceId }).toArray();

        // Return the list of collectors in the workspace
        res.status(200).json({ collectors });
    } catch (error) {
        console.error("Error while fetching collectors:", error);
        res.status(500).json({ error: "Failed to fetch collectors ❌" });
    }
};
