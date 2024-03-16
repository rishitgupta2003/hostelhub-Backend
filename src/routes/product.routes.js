import { Router } from  "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { addProduct } from "../controllers/product.controllers.js";


const router = Router();

router.route("/addProducts").post(verifyJWT, 
    upload.fields(
        [
            {
                name: "coverImg",
                maxCount: 1
            }
        ]
    ), 
    addProduct);

export default router;