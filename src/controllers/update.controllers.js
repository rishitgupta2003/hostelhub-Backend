import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";
import zod from "zod";

//if the user is already logged in
const updatePassword = asyncHandler(
    async (req, res) => {
        const user = await User.findById(req.user?._id).select("-refreshToken");
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
        const user = await User.findById(req.user?._id).select("-password -refreshToken");
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

export {
    updatePassword,
    updateHostel
}