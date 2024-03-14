import { Router } from  "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { updatePassword } from "../controllers/update.controllers.js";

const router = Router();

router.route("/updatePass").post(verifyJWT, updatePassword);

export default router;