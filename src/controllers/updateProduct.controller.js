import { User } from "../models/user.models.js";
import { Product } from "../models/product.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { v2 as cloudinary } from "cloudinary";
import { soldOverlay } from "../util/cloudinary.js";

const updateProductName = asyncHandler(
    async (req, res) => {
        const productID = req.query.id;
        const { productName } = req.body;
        
        try {            
            const product = await Product.findById(productID);       
            
            if (!product) throw new ApiError(400, "Product Doesn't Exist");
                
            if (!req.user) throw new ApiError(400, "Login First");
    
            if(JSON.stringify(req.user._id) !== JSON.stringify(product.createdBy)) throw new ApiError(400, "Unauthorized Access");
    
            product.name = productName;
    
            product.save({validateBeforeSave: false});
    
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "Product Name Updated"
                )
            );
        } catch (error) {
            throw new ApiError(500, `Server Error -> ${error.message}`);
        }
        
    }
)

const updateProductPrice = asyncHandler(
    async (req, res) => {
        const productID = req.query.id;
        const { productPrice } = req.body;
        
        try {            
            const product = await Product.findById(productID);       
            
            if (!product) throw new ApiError(400, "Product Doesn't Exist");
                
            if (!req.user) throw new ApiError(400, "Login First");
    
            if(JSON.stringify(req.user._id) !== JSON.stringify(product.createdBy)) throw new ApiError(400, "Unauthorized Access");
    
            product.price = productPrice;
    
            product.save({validateBeforeSave: false});
    
            return res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "Product Price Updated"
                )
            );
        } catch (error) {
            throw new ApiError(500, `Server Error -> ${error.message}`);
        }
        
    }
)

const soldState = asyncHandler(
    async (req, res) => {
        try {
            const productID = req.query.id;
            
            const product = await Product.findById(productID);
            
            if (!product) throw new ApiError(400, "Product Doesn't Exist");
            console.log(product.createdBy);
            if (!req.user) throw new ApiError(400, "Login First");

            if (JSON.stringify(req.user._id) !== JSON.stringify(product.createdBy)) throw new ApiError(401, "Unauthorized Access");

            if (product.isSold) throw new ApiError(500, "Product Already Sold");

            product.isSold = true;
            
            const arr = product.productImgs;

            await Promise.all(arr.map(async (val) => {
                await deleteCloudinaryResource(val);
            }));

            product.productImgs = [];
            product.coverImg = soldOverlay(product.coverImg);

            await product.save({validateBeforeSave : false});

            return res.status(200).json(
                new ApiResponse(200, {} , "Product Sold")
            );

        } catch (error) {
            throw new ApiError(500, `${error.message}`);
        }
    }
)

const removeProduct = asyncHandler(
    async (req, res) => {
        try {
            const productID = req.query.id;
            const userID = req.user._id;
    
            if(!productID) throw new ApiError(404, "Product ID Not Valid");
    
            const product = await Product.findById(productID);
            if(JSON.stringify(product.createdBy) !== JSON.stringify(userID)) throw new ApiError(401, "Unauthorized Access");
            
            const arr = product.productImgs;
    
            await Promise.all(arr.map(async (val) => {
                await deleteCloudinaryResource(val);
            }));
    
            await deleteCloudinaryResource(product.coverImg);
    
            await Product.findByIdAndDelete(productID);

            await User.findByIdAndUpdate(userID, { $pull: { productAdded: productID } });            
    
            res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "Product Removed Successfully"
                )
            );
        } catch (error) {
            throw new ApiError(500, `${error.message}`);
        }
    }
)


const extractPublicId = (cloudinaryUrl, bucketName) => {
    const parts = cloudinaryUrl.split("/");
    const indexOfBucketName = parts.indexOf(bucketName);
  
    if (indexOfBucketName === -1) {
      return null;
    }
  
    const pathAfterBucketName = parts.slice(indexOfBucketName + 1).join("/");
    const partsWithoutExtension = pathAfterBucketName
      .split("/")
      .map((part) => part.split(".")[0]);
  
    return bucketName + "/" + partsWithoutExtension.join("/");
};

const deleteCloudinaryResource = async (cloudPath) => {
    try {
        if(!cloudPath) return null;
        const public_id = extractPublicId(cloudPath, process.env.CLOUDINARY_CLOUD_NAME).split("/");
        const path = public_id[public_id.length-1];
        const response = await cloudinary.uploader.destroy(path, {
            resource_type: "image",
            invalidate: true,
        });

        return response;
    } catch (error) {
        return error;
    }
}

export {
    updateProductName,
    updateProductPrice,
    soldState,
    removeProduct
}