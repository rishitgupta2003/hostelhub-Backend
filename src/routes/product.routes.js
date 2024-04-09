import { Router } from  "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { addProduct, getAllProducts, getProduct, getProducts } from "../controllers/product.controllers.js";


const router = Router();

router.route("/addProducts").post(verifyJWT, 
    upload.fields(
        [
            {
                name: "coverImg",
                maxCount: 1
            },
            
            {
                name: "productImg",
                maxCount: 4
            }
        ]
    ), 
    addProduct
);

router.route("/getUserProducts").get(verifyJWT,getProducts);

router.route("/allProducts").get(getAllProducts);
router.route("/get-product").get(getProduct);

export default router;