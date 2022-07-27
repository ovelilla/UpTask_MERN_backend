import express from "express";
import {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addPartner,
    deletePartner,
} from "../controllers/projectController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.route("/").get(checkAuth, getProjects).post(checkAuth, createProject);

router
    .route("/:id")
    .get(checkAuth, getProject)
    .put(checkAuth, updateProject)
    .delete(checkAuth, deleteProject);

router.post("/partner", checkAuth, addPartner);
router.post("/partner/:id", checkAuth, deletePartner);

export default router;
