import { Router } from  "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { addProduct, getAllProducts, getProduct, getProducts, advertisement } from "../controllers/product.controllers.js";


const router = Router();

router.route("/addProducts").post(verifyJWT, 
    upload.fields(
        [        
            {
                name: "productImg",
                maxCount: 5
            }
        ]
    ), 
    addProduct
);

router.route("/getUserProducts").get(verifyJWT,getProducts);

router.route("/allProducts").get(getAllProducts);
router.route("/productBanner").get(advertisement);
router.route("/get-product").get(getProduct);

export default router;