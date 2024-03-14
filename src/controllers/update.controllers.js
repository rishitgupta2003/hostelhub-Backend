import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { asyncHandler } from "../util/asyncHandler.js";

//if the user is already logged in
const updatePassword = asyncHandler(
    async (req, res) => {
        console.log(req.user?._id);
        const user = await User.findById(req.user?._id).select("-refreshToken");
        if(!user) throw new ApiError(401, "Unauthorised Access");

        try {
            const { oldPassword, newPassword } = req.body;
            const isCorrect = user.isPasswordCorrect(oldPassword);
            console.log(isCorrect);
            if(!isCorrect){
                throw new ApiError(401, "Current Password Wrong");
            }
    
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

export {
    updatePassword
}