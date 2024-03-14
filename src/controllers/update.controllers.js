import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import zod from "zod";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";
 
//if the user is already logged in
const updatePassword = asyncHandler(
    async (req, res) => {
        const user = await User.findById(req.user?._id).select("-refreshToken -updatedAt -createdAt -hostel_name -avatar -phoneNum -email -gender -uid -name -username");
        if(!user) throw new ApiError(401, "Unauthorised Access");

        try {
            
            const { oldPassword, newPassword } = req.body;
            const isCorrect = user.isPasswordCorrect(oldPassword);

            if(!isCorrect){
                throw new ApiError(401, "Current Password Wrong");
            }

            const password = zod.string().min(8);
            if(!password.safeParse(newPassword).success) throw new ApiError(401, "Password Conditions Not Met");
    
            user.password = newPassword;
            user.save({ validateBeforeSave: false });

            return res.status(200)
                .json(
                    new ApiResponse(200, {}, "Password Updated Successfully")
                )

        } catch (error) {
            throw new ApiError(500, `Server Issue -> ${error.message}`);
        }

    }
)

const updateHostel = asyncHandler(
    async (req, res) => {
        const user = await User.findById(req.user?._id).select("-refreshToken -updatedAt -createdAt -password -avatar -phoneNum -email -gender -uid -name -username");
        if(!user) throw new ApiError(401, "Unauthorised Access");

        try{
            const { newHostel } = req.body;
            const hostel = zod.enum(["NekChand/Zakir", "SUKHNA", "TAGORE"]);

            if(!hostel.safeParse(newHostel).success) throw new ApiError(401, "Hostel Name must be from the List");
            
            user.hostel_name = newHostel;
            user.save({validateBeforeSave: false});
            return res.status(200)
                .json(
                    new ApiResponse(200, {"New Hostel" : newHostel}, "Hostel Updated Successfully")
                )

        }catch(error){
            throw new ApiError(500, `Server Error ->  ${error.message}`);
        }
    }
)

const updateAvatar = asyncHandler(
    async (req, res) => {    

        try {
            const user = await User.findById(req.user?._id).select("-refreshToken -updatedAt -createdAt -hostel_name -password -phoneNum -email -gender -uid -name -username");
            const img_url = user.avatar;
            user.avatar = process.env.DEFAULT_AVATAR_USER_SCHEMA;
    
            let avatarLocalPath;
    
            if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
                avatarLocalPath = req.files.avatar[0].path;
            }
    
            const updatedAvatar = await uploadOnCloudinary(avatarLocalPath);
            
            
            user.avatar = updatedAvatar?.url;
            await user.save({validateBeforeSave: true});
    
            const deleteResponse = await deleteCloudinaryResource(img_url);
            
            console.log(deleteResponse);
    
            return res.status(200)
                .json(
                    new ApiResponse(
                            200, 
                            {"new Url":updatedAvatar?.url}, 
                            "Avatar Updated"
                    )
            )
        } catch (error) {
            throw new ApiError(500, `Server Error -> ${error.message}`);
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
        const path = public_id[public_id.length-1]
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
    updatePassword,
    updateHostel,
    updateAvatar
}