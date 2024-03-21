import { Product } from "../models/product.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import { productAuth } from "../util/authSchema.js";

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
            console.log(req.body);
            const createdBy = req.user._id;
            
            const isValidated = productAuth(productName, description, price);
    
            if(!isValidated.success) throw new ApiError(401, isValidated.data);
    
            let coverImgLink;

            if (req.files && req.files.coverImg && req.files.coverImg.length > 0) {
                const avatarLocalPath = req.files.coverImg[0].path;
                coverImgLink = await uploadOnCloudinary(avatarLocalPath);
            }

            
            let arr = [];

            if (req.files && Array.isArray(req.files.productImg) && req.files.productImg.length > 0) {
                
                const uploadPromises = req.files.productImg.map(async (file) => {
                    const productImgLocalPath = file.path;
                    try {
                        const productImgLink = await uploadOnCloudinary(productImgLocalPath);
                        return productImgLink.url;
                    } catch (error) {
                        console.error(`Error uploading file ${file.filename}: ${error.message}`);
                        return null;
                    }
                });

                const uploadedUrls = await Promise.all(uploadPromises);
                arr = uploadedUrls.filter(url => url !== null);
            }
            

            const productObject = {
                "name": productName,
                "coverImg": coverImgLink?.url,
                "productImgs": arr,
                "description": description,
                "price": price,
                "createdBy": createdBy,
            } 
            
            await Product.create(
                productObject
            );

            
            return res.status(200).json(
                new ApiResponse(
                    200, 
                    productObject, 
                    "Product Added Successfully"
                )
            )

        } catch (error) {
            throw new ApiError(400, error.message);
        }

    } 
)

const getAllProducts = asyncHandler(
    async(req, res) => {
        try {
            const products = await Product.find(
                {
                    $and : [{"isSold" : false}]
                }
            );
            res.status(200).json(
                new ApiResponse(
                    200,
                    products,
                    "Done"
                )
            );
        } catch (error) {
            throw new ApiError(500, `Server Error -> ${error.message}`);
        }
    }
)

const getProduct = asyncHandler(
    async (req, res) => {
        try {
            
            const productID = req.query.id;
            const product = await Product.findById(productID);
            
            if(!product) throw new ApiError(401, "Product Not Available");

            res.status(200).json(
                new ApiResponse(
                    200,
                    product,
                    "Product Fetched Successfully"
                )
            )
        } catch (error) {
            throw new ApiError(401, "Product Not Found");
        }
    }
)

export {
    addProduct,
    getAllProducts,
    getProduct
}