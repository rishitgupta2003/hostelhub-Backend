import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import userAdd_Auth from "../util/authSchema.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";

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
            throw new ApiError(400, "Fill It with Right Formats");
        }

        const usernameExist = await User.findOne(
            {
                $or : [{username}, {email}]
            }
        );

        if(usernameExist) throw new ApiError(409, "Username / Email Alredy being used");

        const avatarLocalPath = req.files?.avatar[0]?.path;
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

export { registerUser }