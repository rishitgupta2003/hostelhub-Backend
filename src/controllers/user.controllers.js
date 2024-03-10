import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { userAdd_Auth, userLogin_Auth } from "../util/authSchema.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";

async function generateAccessAndRefreshToken(userID){
    try{
        const user = User.findById(userID).select("-password");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {
            accessToken,
            refreshToken
        }

    }catch(err){
        throw new ApiError(500, "Error while Generating")
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
            throw new ApiError(400, "Fill It with Right Formats");
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

        console.log(avatarLocalPath);
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log(avatar);

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

        
        let user = await User.findOne(
            {
                $or: [
                    {username : username_email},
                    {email : username_email}
                ]
            }
        ).select(
            "-password -refreshToken"
        );

        if(!user) throw new ApiError(404, "User Doesn't Exist");
        
        const passCheck = await user.isPasswordCorrect(password);

        if(!passCheck) throw new ApiError(401, "Invalid Credentials");

        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

        user = await User.findById(user._id).select("-password -refreshToken");

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
                    user,
                    "User Logged In"
                )
            );        

    }
)

export { registerUser, loginUser }