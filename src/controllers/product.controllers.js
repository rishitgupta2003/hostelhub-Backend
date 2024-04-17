import { Product } from "../models/product.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import { productAuth } from "../util/authSchema.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

const addProduct = asyncHandler(
    /*
          Product Name, Description, Price, CreatedBy, category
          Validate Details
          Upload Imgs : CoverImg
                        ProductImg
          
      */

    async (req, res) => {
        try {
            const { productName, description, price, isAnonymous } = req.body;
            console.log(req.body);
            const createdBy = req.user._id;

            const isValidated = productAuth(productName, description, price);

            if (!isValidated.success) throw new ApiError(401, isValidated.data);

            let coverImgLink;

            if (req.files && req.files.coverImg && req.files.coverImg.length > 0) {
                const avatarLocalPath = req.files.coverImg[0].path;
                coverImgLink = await uploadOnCloudinary(avatarLocalPath);
            }

            let arr = [];

            if (
                req.files &&
                Array.isArray(req.files.productImg) &&
                req.files.productImg.length > 0
            ) {
                const uploadPromises = req.files.productImg.map(async (file) => {
                    const productImgLocalPath = file.path;
                    try {
                        const productImgLink =
                            await uploadOnCloudinary(productImgLocalPath);
                        return productImgLink.url;
                    } catch (error) {
                        console.error(
                            `Error uploading file ${file.filename}: ${error.message}`
                        );
                        return null;
                    }
                });

                const uploadedUrls = await Promise.all(uploadPromises);
                arr = uploadedUrls.filter((url) => url !== null);
            }
            
            arr.push(coverImgLink?.url);

            const productObject = {
                name: productName,
                coverImg: coverImgLink?.url,
                productImgs: arr,
                description: description,
                price: price,
                createdBy: createdBy,
                isAnonymous: Boolean(Number(isAnonymous))
            };

            const product = await Product.create(productObject);

            const user = await User.findById(req.user._id).select(
                "-password -refreshToken"
            );

            user.productAdded?.push(product._id);

            user.save({ validateBeforeSave: false });

            return res
                .status(200)
                .json(
                    new ApiResponse(200, productObject, "Product Added Successfully")
                );
        } catch (error) {
            throw new ApiError(400, error.message);
        }
    }
);

const getAllProducts = asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({
            $and: [{ isSold: false }],
        });
        res.status(200).json(new ApiResponse(200, products.reverse(), "Done"));
    } catch (error) {
        throw new ApiError(500, `Server Error -> ${error.message}`);
    }
});

const getProduct = asyncHandler(async (req, res) => {
    try {
        const productID = req.query.id;

        const product = await Product.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(String(productID)),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "creator_details",
                },
            },
            {
                $addFields: {
                    username: {
                        $first: "$creator_details.name",
                    },
                    phoneNum: {
                        $first: "$creator_details.phoneNum",
                    },
                    hostelName: {
                        $first: "$creator_details.hostel_name",
                    },
                    uid: {
                        $first: "$creator_details.uid",
                    },
                },
            },
            {
                $project: {
                    name: 1,
                    coverImg: 1,
                    productImgs: 1,
                    description: 1,
                    price: 1,
                    isSold: 1,
                    username: 1,
                    phoneNum: 1,
                    hostelName: 1,
                    uid: 1,
                    isAnonymous: 1
                },
            },
        ]);

        res
            .status(200)
            .json(new ApiResponse(200, product[0], "Product Fetched Successfully"));
    } catch (error) {
        throw new ApiError(401, "Product Not Found");
    }
});

const getProducts = asyncHandler(
    async (req, res) => {
        try {
            const arr = req.user.productAdded;

            let data = await Promise.all(arr.map(id => Product.findById(id)));

            res.status(200).json(
                new ApiResponse(
                    200,
                    data.reverse(),
                    "Products Fetched Successfully"
                )
            );
        } catch (error) {
            throw new ApiError(404, `User Product Not Found -> ${error.message}`);
        }
    }
)

const advertisement = asyncHandler(
    async (req, res) => {
        try {
            const products = await Product.aggregate([
                { $match: { isSold: false } },
                { $sample: { size: 4 } },
            ]);
            res.status(200).json(new ApiResponse(200, products, "Done"));
        } catch (error) {
            throw new ApiError(500, `Server Error -> ${error.message}`);
        }    
    }
);

export { addProduct, getAllProducts, getProduct, getProducts, advertisement };