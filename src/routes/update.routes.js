import { Router } from  "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { updatePassword, updateHostel } from "../controllers/update.controllers.js";

const router = Router();

router.route("/updatePass").patch(verifyJWT, updatePassword);
router.route("/updateHostel").patch(verifyJWT, updateHostel);

export default router;