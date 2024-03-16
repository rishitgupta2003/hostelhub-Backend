import { Product } from "../models/product.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import { productAuth } from "../util/authSchema.js";
import jwt from "jsonwebtoken";

const addProduct = asyncHandler(
    
    /*
        Product Name, Description, Price, CreatedBy, category
        Validate Details
        Upload Imgs : CoverImg
                      ProductImg
        
    */

    async (req, res) => {
        
        try {
            const { productName, description, price } = req.body;
            const createdBy = req.user._id;
            
            const isValidated = productAuth(productName, description, price);
    
            if(!isValidated.success) throw new ApiError(401, isValidated.data);
    
            let avatarLocalPath;
            if(req.files && Array.isArray(req.files.coverImg) && req.files.coverImg.length > 0){
                avatarLocalPath = req.files.coverImg[0].path;
            }

            const coverImgLink = await uploadOnCloudinary(avatarLocalPath);
    
            const productObj = await Product.create(
                {
                    "name": productName,
                    "coverImg": coverImgLink?.url,
                    "productImgs":["/gjfhdlgkdjhgf","/jkghflkjghldg","/jkghlkgfgdfgfdg","/gkjagkjgajghk"],
                    "description": description,
                    "price": price,
                    "createdBy": createdBy,
                }
            );
            
            return res.status(200).send(
                productObj
            )
        } catch (error) {
            throw new ApiError(400, error.message);
        }

    } 
)


export {
    addProduct
}