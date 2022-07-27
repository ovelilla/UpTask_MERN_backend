import express from "express";
import {
    signup,
    confirm,
    login,
    logout,
    recover,
    checkToken,
    restore,
    auth,
} from "../controllers/userController.js";
import checkAuth from "../middleware/checkAuth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/logout", checkAuth, logout);
router.post("/confirm", confirm);
router.post("/recover", recover);
router.post("/check-token", checkToken);
router.post("/restore", restore);

router.get("/auth", checkAuth, auth);

export default router;
