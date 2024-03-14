import { Router } from  "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, getUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields(
        [{
            name: "avatar",
            maxCount: 1
        }]
    ),
    registerUser
)


router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/renewToken").post(refreshAccessToken);
router.route("/getUser").get(verifyJWT, getUser);

export default router;