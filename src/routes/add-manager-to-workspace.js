import { DatabaseModule } from "../database/database.js";
import { verifyJWT } from "../utilities/jwtUtils.js";

/**
 * Handle adding a manager to a workspace request. 🚀
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { token, workspaceId, managerUsername } = req.body;

        // Verify the token using the JWT verification utility. 🔒
        const decodedToken = verifyJWT(token);

        if (!decodedToken) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userUID = decodedToken.userUID;

        /** @type {Db} */
        const db = DatabaseModule.getDatabase();

        /** @type {Collection} */
        const workspacesCollection = db.collection("workspaces"); // Change "workspaces" to your actual collection name

        // Find the workspace by workspaceId 🕵️‍♂️
        const workspace = await workspacesCollection.findOne({ workspaceId });

        if (!workspace) {
            // Workspace not found
            return res.status(404).json({ error: "Workspace not found" });
        }

        if (workspace.ownerId !== userUID) {
            // Only the owner can add managers
            return res.status(403).json({ error: "You are not authorized to add managers to this workspace" });
        }

        // Check if the managerUsername exists and get the userUID.
        /** @type {Collection} */
        const usersCollection = db.collection("users"); // Change "users" to your actual collection name
        const managerUser = await usersCollection.findOne({ username: managerUsername });

        if (!managerUser) {
            // User not found
            return res.status(404).json({ error: "Manager user not found" });
        }

        // Check if the manager is already a teamMember, and if so, remove them from the teamMembers list.
        if (workspace.teamMembers.includes(managerUser.userUID)) {
            workspace.teamMembers = workspace.teamMembers.filter((uid) => uid !== managerUser.userUID);
        }

        // Check if the manager is already a manager.
        if (workspace.managers.includes(managerUser.userUID)) {
            return res.status(400).json({ error: "The user is already a manager of this workspace" });
        }

        // Add the manager to the managers list.
        workspace.managers.push(managerUser.userUID);
        // Print the workspace before updating
        console.log("Workspace before update:", workspace);

        // Update the workspace document with the new managers list.
        const updateResult = await workspacesCollection.updateOne(
            { workspaceId },
            { $set: { managers: workspace.managers, teamMembers: workspace.teamMembers } }
        );

        // Print the update result
        console.log("Update result:", updateResult);

        if (updateResult.modifiedCount === 1) {
            // Fetch the updated workspace
            const updatedWorkspace = await workspacesCollection.findOne({ workspaceId });
            res.status(200).json({ message: "Manager added successfully", workspace: updatedWorkspace });
        } else {
            res.status(500).json({ error: "Adding manager failed" });
        }
    } catch (error) {
        console.error("Error during adding manager to workspace:", error);

        // Send a generic error response. ⚠️
        res.status(500).json({ error: "Adding manager failed" });
    }
};
