import { DatabaseModule } from "../database/database.js";
import { verifyJWT } from "../utilities/jwtUtils.js";

/**
 * Handle adding a team member to a workspace request. 🚀
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { token, workspaceId, teamMemberUsername } = req.body;

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

        // Check if the user is the owner or a manager.
        if (workspace.ownerId !== userUID && !workspace.managers.includes(userUID)) {
            // Only the owner and managers can add team members
            return res.status(403).json({ error: "You are not authorized to add team members to this workspace" });
        }

        // Check if the teamMemberUsername exists and get the userUID.
        /** @type {Collection} */
        const usersCollection = db.collection("users"); // Change "users" to your actual collection name
        const teamMemberUser = await usersCollection.findOne({ username: teamMemberUsername });

        if (!teamMemberUser) {
            // User not found
            return res.status(404).json({ error: "Team member user not found" });
        }

        // Check if the team member is already a manager.
        if (workspace.managers.includes(teamMemberUser.userUID)) {
            // Check if the requesting user is the owner (only owner can demote a manager to a team member).
            if (workspace.ownerId !== userUID) {
                return res.status(403).json({ error: "Only the owner can demote a manager to a team member" });
            }

            // Demote the user from manager to team member.
            workspace.managers = workspace.managers.filter((uid) => uid !== teamMemberUser.userUID);
        }

        // Check if the team member is already a team member.
        if (workspace.teamMembers.includes(teamMemberUser.userUID)) {
            return res.status(400).json({ error: "The user is already a team member of this workspace" });
        }

        // Add the team member to the teamMembers list.
        workspace.teamMembers.push(teamMemberUser.userUID);

        // Update the workspace document with the new teamMembers list.
        const updateResult = await workspacesCollection.updateOne(
            { workspaceId },
            { $set: { teamMembers: workspace.teamMembers, managers: workspace.managers } }
        );

        if (updateResult.modifiedCount === 1) {
            // Team member added successfully
            res.status(200).json({ message: "Team member added successfully", workspace });
        } else {
            res.status(500).json({ error: "Adding team member failed" });
        }
    } catch (error) {
        console.error("Error during adding team member to workspace:", error);

        // Send a generic error response. ⚠️
        res.status(500).json({ error: "Adding team member failed" });
    }
};
