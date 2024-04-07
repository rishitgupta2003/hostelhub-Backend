import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { userAdd_Auth, userLogin_Auth } from "../util/authSchema.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import jwt from "jsonwebtoken"; 

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

        const message = `Verify your Email -> OTP : ${verificationCode} OR Click on the link given -> http://localhost:${process.env.PORT}/api/v1/users/verifyToken?token=${token}`;

        res.status(200).json(
            new ApiResponse(
                200,
                createdUser,
                message
            )
        );

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

            const message = `Verify your Email -> OTP : ${verificationCode} OR Click on the link given -> http://localhost:${process.env.PORT}/api/v1/users/verifyToken?token=${token}`;

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
            console.log(user);
            if(incomingRefreshToken !== user.refreshToken) throw new ApiError(401, "Refresh Token Expired");
            
            const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user?._id);
                   
            const options = {
                httpOnly: true,
                secure: true
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
)


const getUser = asyncHandler(
    async (req, res) => {
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
    }
)

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


export { registerUser, loginUser, logoutUser, refreshAccessToken, getUser, verifyUserLink, verifyUserOTP };