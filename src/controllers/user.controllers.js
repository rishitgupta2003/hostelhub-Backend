import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { userAdd_Auth, userLogin_Auth } from "../util/authSchema.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import jwt from "jsonwebtoken"; 


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
        throw new ApiError(500, err.message);
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
            }
        )
        
        const createdUser = await User.findById(userObj._id).select(
            "-password -refreshToken"
        )

        if(!createdUser){
            throw new ApiError(500, "Something Went Wrong while Registering");
        }

        return res.status(201).json(
            new ApiResponse(200, createdUser , "User Registered Successfully")
        )
    }
)

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

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

        const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

        const options = {
            httpOnly: true,
            secure: true
        }

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
)

const logoutUser = asyncHandler(
    async (req, res) => {
        const user = await User.findById(req.user._id).select("-password");

        user.refreshToken = undefined;
        await user.save({validateBeforeSave: false});
        
        const options = {
            httpOnly: true,
            secure: true
        }

        res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {} , "User Logged Out Successfully")
        )
    }
)

const refreshAccessToken = asyncHandler(
    async(req, res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if(!incomingRefreshToken) throw new ApiError(401, "Unauthorized Access");
        try {
            const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
            const user = await User.findById(decodedToken?._id).select("-password");
    
            if(!user) throw new ApiError(401, "Invalid Refresh Token");
    
            if(incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh Token Expired");
            
            const {accessToken, newRefreshToken} = generateAccessAndRefreshToken(user?._id);
    
            const options = {
                httpOnly: true,
                secure: true
            }
    
            return res.status(200)
                .cookie("acceessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ApiResponse(
                        200,
                        {accessToken, "Refresh Token": newRefreshToken},
                        "User Access Renewed"
                    )
                );
        } catch (error) {
            throw new ApiError(401, "Server Error");
        }
    }
)

export { registerUser, loginUser, logoutUser, refreshAccessToken };