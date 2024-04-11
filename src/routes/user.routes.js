import { Router } from  "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, getUser, verifyUserLink, verifyUserOTP, requestOTP, forgetPassword, verifyForgetOTP, newPassword } from "../controllers/user.controllers.js";
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

router.route('/forgetPassword').post(forgetPassword);
router.route('/verifyForgetOTP').post(verifyForgetOTP);
router.route('/newPassword').post(newPassword);
router.route('/verifyToken').post(verifyUserLink);
router.route('/verifyOTP').post(verifyUserOTP);
router.route('/requestOTP').post(requestOTP);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/renewToken").post(refreshAccessToken);
router.route("/getUser").get(verifyJWT, getUser);

export default router;