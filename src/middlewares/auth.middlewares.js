import { User } from "../models/user.models.js";
import { ApiError } from "../util/ApiError.js";
import { asyncHandler } from "../util/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(
    async (req, res, next) => {
        try {
            const token = req.cookies?.accessToken;
            if(!token) throw new ApiError(401, "Unauthorized Request");
    
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            const user = await User.findById(decodedToken?._id).select(
                "-password -refreshToken"
            );
    
            if(!user) throw new ApiError(401, "Invalid Token");
    
            req.user = user;

            next();
        } catch (error) {
            throw new ApiError(401, error?.message || "Something Went Wrong");
        }
    }
)