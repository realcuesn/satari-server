import { Router } from "express";
import signup from "../routes/signup.js";
import signin from "../routes/signin.js";
import tokenSignin from "../routes/token-signin.js";
import createWorkspace from "../routes/create-workspace.js";
import addManagerToWorkspace from "../routes/add-manager-to-workspace.js";
import fetchUserWorkspaces from "../routes/fetch-user-workspaces.js";
import addTeamMemberToWorkspace from "../routes/add-team-member-to-workspace.js";
import collectFormData from "../routes/collect-form-data.js";
import collectFormThroughSatariLink from "../routes/collect-form-through-satari-link.js";
import createCollector from "../routes/create-collector.js";
import fetchCollectors from "../routes/fetch-collectors.js";
import deleteCollector from "../routes/delete-collector.js";

const router = Router();

//Handle Root
router.get('/', (req, res) => {
    res.status(200).send('Ok')
})


// Handle GET request at the root endpoint
router.post("/fetch-user-workspaces", fetchUserWorkspaces);



// Handle Post request at the root endpoint
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/login-with-token", tokenSignin);
router.post("/create-workspace", createWorkspace);
router.post("/add-manager-to-workspace", addManagerToWorkspace);
router.post("/add-team-member-to-workspace", addTeamMemberToWorkspace);
router.post("/collect-form-data", collectFormData);
router.post("/collect-form-through-satari-link", collectFormThroughSatariLink);
router.post("/create-collector", createCollector)
router.post("/fetch-collectors", fetchCollectors)
router.post("/delete-collector", deleteCollector)

export default router;
