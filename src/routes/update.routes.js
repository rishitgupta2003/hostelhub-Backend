import { Router } from  "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { updatePassword, updateHostel, updateAvatar } from "../controllers/updateUser.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { soldState } from "../controllers/updateProduct.controller.js";

const router = Router();

router.route("/updatePass").patch(verifyJWT, updatePassword);
router.route("/updateHostel").patch(verifyJWT, updateHostel);
router.route("/updateAvatar").patch(verifyJWT,
    upload.fields(
        [{
            name: "avatar",
            maxCount: 1
        }]
    ),
    updateAvatar
);

router.route("/soldOut").patch(verifyJWT, soldState);

export default router;