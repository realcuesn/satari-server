import { DatabaseModule } from "../database/database.js";
import { verifyJWT } from "../utilities/jwtUtils.js";
import { v4 as uuidv4 } from 'uuid';

/**
 * Handle workspace creation request. 🚀
 *
 * @param {import('express').Request} req - Express Request object.
 * @param {import('express').Response} res - Express Response object.
 */
export default async (req, res) => {
    try {
        const { token, workspaceName, workspaceDescription } = req.body;

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

        // Check if the owner already owns 5 workspaces.
        const ownedWorkspacesCount = await workspacesCollection.countDocuments({ ownerId: userUID });

        if (ownedWorkspacesCount >= 5) {
            return res.status(403).send("You have reached the maximum limit of owned workspaces");
        }

        // Generate a unique workspace ID using uuid.
        const workspaceId = uuidv4();

        // Create the workspace document.
        const workspace = {
            workspaceId,
            ownerId: userUID,
            managers: [userUID], // Initially, the owner is also a manager.
            teamMembers: [], // Initially, no team members.
            workspaceName,
            workspaceDescription,
        };

        // Insert the workspace document into the database. 📥
        const result = await workspacesCollection.insertOne(workspace);

        // Check if the insertion was acknowledged. ✅
        if (result.acknowledged) {
            res.status(201).json({ message: "Workspace creation successful 🎉", workspace });
        } else {
            res.status(500).json({ error: "Workspace creation failed ❌" });
        }
    } catch (error) {
        console.error("Error during workspace creation:", error);

        // Send a generic error response. ⚠️
        res.status(500).json({ error: "Workspace creation failed ❌" });
    }
};
