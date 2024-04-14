import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { userAdd_Auth, userLogin_Auth } from "../util/authSchema.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import jwt from "jsonwebtoken"; 
import { mailUser } from "../util/nodeMailer.js";
import { Product } from "../models/product.models.js";
import mongoose from "mongoose";
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

async function generateAccessAndRefreshToken(userID){
    try{

        const user = await User.findById(userID).select("-password");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {
            accessToken,
            refreshToken
        }

    }catch(err){
        throw new ApiError(500, `${err.message}`);
    }
}

const registerUser = asyncHandler(
    async (req, res) => {
        //get user details
        //validations
        //check if already exists
        //check for imgs
        //upload to cloudinary
        //create user object -> add to db
        //remove refresh and access token from field
        //check for user creation
        //return response

        const {username, name, email, password, uid, gender, phoneNum, hostel_name} = req.body;
        const isValidated = userAdd_Auth(username, name, password, gender, email, phoneNum, hostel_name, uid);
    
        if(!isValidated.success){
            throw new ApiError(400, `Fill It with Right Formats -> ${isValidated.data}`);
        }

        const usernameExist = await User.findOne(
            {
                $or : [{username}, {email}]
            }
        );

        if(usernameExist) throw new ApiError(409, "Username / Email Alredy being used");

        let avatarLocalPath;

        if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
            avatarLocalPath = req.files.avatar[0].path;
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        const verificationCode = getRandomInt(100000);

        const userObj = await User.create(
            {
                username : username.toLowerCase(),
                name,
                uid,
                gender,
                email,
                password,
                phoneNum,
                avatar : avatar?.url,
                hostel_name: hostel_name,
                verificationCode: verificationCode
            }
        )
        
        const createdUser = await User.findById(userObj._id).select(
            "-password -refreshToken"
        )

        if(!createdUser){
            throw new ApiError(500, "Something Went Wrong while Registering");
        }

        const token = jwt.sign(
            {
                _id : createdUser._id,
                verificationCode: verificationCode
            },
            process.env.REGISTER_TOKEN_PASS,
            {
                expiresIn: process.env.REGISTER_TOKEN_EXPIRY
            }
        );

        if(!token) throw new ApiError(500, "Request Token Again");

        const message = `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <p style="font-size: 16px;">Verify your Email:</p>
            <p style="font-size: 16px;">OTP: ${verificationCode}</p>
            </div>`;
            
        await mailUser(email, "Verify Your Account", message);

        res.status(200).json(
            new ApiResponse(
                200,
                createdUser,
                message
            )
        );

    }
);

const loginUser = asyncHandler(
    async(req, res) => {
        //collect details from frontend -> username or email / password
        //validate details -> zod
        //find user
        //password bcrypt check
        //access token generate
        //send cookies


        const {username_email, password} = req.body;

        const validateLogin = userLogin_Auth(username_email, password);

        if(!validateLogin.success) throw new ApiError(404, `Fill with correct Formats -> ${validateLogin.data}`);

        
        const user = await User.findOne(
            {
                $or: [
                    {username : username_email},
                    {email : username_email}
                ]
            }
        ).select(
            "-refreshToken"
        );

        if(!user) throw new ApiError(404, "User Doesn't Exist");
        
        const passCheck = user.isPasswordCorrect(password);

        if(!passCheck) throw new ApiError(401, "Invalid Credentials");

        if(!user.isVerified){
            const verificationCode = getRandomInt(100000);
            user.verificationCode = verificationCode;
            user.save({validateBeforeSave: false}); 
            
            const token = jwt.sign(
                {
                    _id : user._id,
                    verificationCode: verificationCode
                },
                process.env.REGISTER_TOKEN_PASS,
                {
                    expiresIn: process.env.REGISTER_TOKEN_EXPIRY
                }
            );

            if(!token) throw new ApiError(500, "Request Token Again");

            const message = `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <p style="font-size: 16px;">Verify your Email:</p>
            <p style="font-size: 16px;">OTP: ${verificationCode}</p>
            </div>`;
            
            await mailUser(user.email, "Verify Your Account", message);

            return res.status(300).json(
                new ApiResponse(
                    300,
                    user,
                    message
                )
            );
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        };

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    loggedInUser,
                    "User Logged In"
                )
            );        

    }
);

const logoutUser = asyncHandler(
    async (req, res) => {
        const user = await User.findById(req.user._id).select("-password");

        user.refreshToken = undefined;
        await user.save({validateBeforeSave: false});
        
        const options = {
            expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
        };

        res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {} , "User Logged Out Successfully")
        )
    }
);

const refreshAccessToken = asyncHandler(
    async(req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken) throw new ApiError(401, "Unauthorized Access");
        try {
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
            const user = await User.findById(decodedToken?._id).select("-password");
    
            if(!user) throw new ApiError(401, "Invalid Refresh Token");
            console.log(user);
            if(incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh Token Expired");
            
            const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user?._id);
                   
            const options = {
                expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                secure: true,
                sameSite: "none",
                path: "/",
            };


            res.clearCookie("accessToken", options).clearCookie("refreshToken", options);

            user.refreshToken = newRefreshToken;
            await user.save({validateBeforeSave: false});
    
            return res.status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        {"Refresh Token": newRefreshToken},
                        "User Access Renewed"
                    )
                );
        } catch (error) {
            throw new ApiError(500, `Server Error ->  ${error.message}`);
        }
    }
);


const getUser = asyncHandler(
    async (req, res) => {

        const user = await User.aggregate(
            [
                {
                    $match: {
                        _id: req.user?._id
                    }
                }
                ,{
                    $project: {
                        username: 1,
                        name: 1,
                        uid: 1,
                        gender: 1,
                        email: 1,
                        phoneNum: 1,
                        productAdded: 1,
                        hostel_name: 1,
                        avatar: 1

                    }
                }
            ]
        )

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            user[0],
            "User fetched successfully"
        ))
    }
);

const verifyUserLink = asyncHandler(
    async(req, res) => {
        const token = req.query.token;

        if(!token) throw new ApiError(404, "Unauthorised Request");

        const decodedToken = jwt.verify(
            token,
            process.env.REGISTER_TOKEN_PASS
        );

        const id = decodedToken._id;
        const verificationCode = decodedToken.verificationCode;

        const user = await User.findById(id).select("-password");

        if(!user) throw new ApiError(404, "Unauthorized Request");

        if(user.verificationCode !== verificationCode) throw new ApiError("404", "Use Latest Link");

        user.verificationCode = undefined;
        user.isVerified = true;

        user.save({validateBeforeSave: false});

        res.status(200).json(
            new ApiResponse(
                200,
                user,
                "You Can Now Login"
            )
        );
    }
);

const verifyUserOTP = asyncHandler(
    async(req, res) => {
        const { id, OTP } = req.body;

        if(!OTP) throw new ApiError(401, "Enter OTP First");

        if(!id) throw new ApiError(500, "Use Link : Server Error");

        const userObj = await User.findById(id).select("-password");

        if(!userObj) throw new ApiError(404, "User Not Found");

        if(userObj.isVerified) throw new ApiError(401, "User Already Verified");

        if(userObj.verificationCode !== Number(OTP)) throw new ApiError(409, "OTP Wrong");

        userObj.isVerified = true;
        userObj.verificationCode = undefined;
        userObj.save({validateBeforeSave: false});

        res.status(200).json(
            new ApiResponse(
                200,
                {},
                "User Verified"
            )
        );

    }
);

const requestOTP = asyncHandler(
    async (req, res) => {
        const id = req.query.id;

        const user = await User.findById(id).select("-password");

        if(!user) throw new ApiError(404, "User Doesn't Exist");

        if(user.isVerified) throw new ApiError(401, "User Already Verified");

        const verificationCode = getRandomInt(10000);
        
        user.verificationCode = verificationCode;

        user.save({validateBeforeSave: true});

        const token = jwt.sign(
            {
                _id : user._id,
                verificationCode: verificationCode
            },
            process.env.REGISTER_TOKEN_PASS,
            {
                expiresIn: process.env.REGISTER_TOKEN_EXPIRY
            }
        );

        if(!token) throw new ApiError(500, "Request Token Again");

        const message = `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <p style="font-size: 16px;">Verify your Email:</p>
        <p style="font-size: 16px;">OTP: ${verificationCode}</p>
        </div>`;
        
        await mailUser(user.email, "Verify Your Account", message);

        res.status(200).json(
            new ApiResponse(
                200,
                {},
                "OTP Mailed Again"
            )
        );

    }
);

const forgetPassword = asyncHandler(
    async(req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne(
                {
                    email: email
                }
            ).select("-password -refreshToken");
            
            const verificationCode = getRandomInt(100000);
            user.verificationCode = verificationCode;
            user.save({validateBeforeSave: true});
    
    
            const message = `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <p style="font-size: 16px;">Authenticate your Email:</p>
            <p style="font-size: 16px;">OTP: ${verificationCode}</p>
            </div>`
    
            await mailUser(user.email, "Forget Password Request", message);
    
            res.status(200).json(
                new ApiResponse(
                    200,
                    user,
                    "OTP Send - Verify Email"
                )
            );
        } catch (error) {
            throw new ApiError(500, `${error.message}`);
        }
    }
);

const verifyForgetOTP = asyncHandler(
    async (req, res) => {
        try {
            const { id, OTP } = req.body;
    
            if(!OTP) throw new ApiError(401, "Enter OTP First");
    
            if(!id) throw new ApiError(500, "Use Link : Server Error");
    
            const userObj = await User.findById(id).select("-password");
    
            if(!userObj) throw new ApiError(404, "User Not Found");
    
            if(userObj.verificationCode !== Number(OTP)) throw new ApiError(409, "OTP Wrong");
    
            res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "OTP Verified"
                )
            )
        } catch (error) {
            new ApiError(500, `${error.message}`);
        }
    }
);

const newPassword = asyncHandler(
    async (req, res) => {
        try {
            const { userID, password } = req.body;
            const user = await User.findById(userID);
            user.password = password;
    
            user.save({validateBeforeSave: false});
            
            res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    "Password Updated Successfully"
                )
            );
        } catch (error) {
            throw new ApiError(500, `${error.message}`);
        }
    }
);


const requestProduct = asyncHandler(
    async (req, res) => {
        try {
            const id = req.user._id;
            if(!id) throw new ApiError(401, "Unauthorized Access");
            const productID = req.query.id;
            if(!productID) throw new ApiError(402, "Product ID is not Valid");
    
            const user = await User.findById(id).select(
                "-password -refreshToken"
            );
    
            if(!user) throw new ApiError(500, "User Cannot be located");
    
            const product = await Product.aggregate(
                [
                    {
                        $match: {
                            _id: new mongoose.Types.ObjectId(String(productID))
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "creator_details",
                        }
                    },
                    {
                        $addFields: {
                            username: {
                                $first: "$creator_details.username",
                            },
                            email: {
                                $first: "$creator_details.email",
                            },
                            userName: {
                                $first: "$creator_details.name",
                            },
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            email: 1,
                            userName: 1,
                            coverImg: 1
                        }
                    }
                ]
            );
    
            if(!product.length) throw new ApiError(404, "Product Not Found");
    
            console.log(product[0]);
    
            const message = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                <div style="margin-bottom: 20px;">
                    <p>Dear ${product[0].userName},</p>
                    <p>${user.username} is interested in your Product: ${product[0].name}.</p>
                    <img src="${product[0].coverImg}" alt="Product Image" style="max-width: 100%;">
                    <p>You can contact this user. Details Below:</p>
                </div>
                <table style="margin-top: 20px; border-collapse: collapse; width: 100%;">
                    <tr>
                        <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Detail</th>
                        <th style="padding: 8px; border-bottom: 1px solid #ddd; background-color: #f2f2f2; text-align: left;">Information</th>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Name</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${user.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Contact Number</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${user.phoneNum}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Email ID</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${user.email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Hostel Name</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">${user.hostel_name}</td>
                    </tr>
                </table>
            </div>`;

            const senderMessage = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px; background-color: #f9f9f9;">
                <div style="margin-bottom: 20px;">
                    <p>Dear ${user.name}, Product Requested Successfully: ${product[0].name}.</p>
                    <p>Uploader will reach out to you as soon as possible.</p>
                    <img src="${product[0].coverImg}" alt="Product Image" style="max-width: 100%;">
                </div>`;
            
            await mailUser(product[0].email, "Your Product has a Buyer", message);
            await mailUser(user.email, "Product Requested Successfully", senderMessage);
            res.status(200).json(
                new ApiResponse(
                    200,
                    {},
                    message
                )
            );
        } catch (error) {
            throw new ApiError(500, `${error.message}`);
        }

    }
);

export { registerUser, loginUser, logoutUser, refreshAccessToken, getUser, verifyUserLink, verifyUserOTP, requestOTP, forgetPassword, verifyForgetOTP, newPassword, requestProduct };