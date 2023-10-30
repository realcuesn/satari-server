import { DatabaseModule } from "../database/database.js";
import { verifyJWT } from "../utilities/jwtUtils.js";

/**
 * Fetch user workspaces based on their role (owner, manager, or team member).
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        console.log(req.body)
        const { token } = req.body;
        console.log("Received token:", token); // Add this line to check the received token
        // Verify the token using the JWT verification utility.
        const decodedToken = verifyJWT(token);

        if (!decodedToken) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userUID = decodedToken.userUID;

        /** @type {Db} */
        const db = DatabaseModule.getDatabase();

        /** @type {Collection} */
        const workspacesCollection = db.collection("workspaces");

        // Find all workspaces where the user is the owner, manager, or team member.
        const userWorkspaces = await workspacesCollection.find({
            $or: [
                { ownerId: userUID },
                { managers: { $in: [userUID] } },
                { teamMembers: { $in: [userUID] } }
            ]
        }).toArray();

        // Extract the necessary information for the response.
        const responseWorkspaces = userWorkspaces.map(workspace => ({
            workspaceId: workspace.workspaceId,
            title: workspace.workspaceName,
            description: workspace.workspaceDescription,
            role: "",
            managers: workspace.managers,
            teamMembers: workspace.teamMembers,
            ownerId: workspace.ownerId
        }));

        // Determine the role for each workspace.
        responseWorkspaces.forEach(workspace => {
            if (workspace.ownerId === userUID) {
                workspace.role = "Owner";
            } else if (workspace.managers.includes(userUID)) {
                workspace.role = "Manager";
            } else {
                workspace.role = "Team Member";
            }
        });

        res.status(200).json({ workspaces: responseWorkspaces });
    } catch (error) {
        console.error("Error while fetching user workspaces:", error);
        res.status(500).json({ error: "Failed to fetch user workspaces" });
    }
};
