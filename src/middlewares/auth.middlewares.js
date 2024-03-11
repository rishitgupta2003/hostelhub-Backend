import { User } from "../models/user.models";
import { ApiError } from "../util/ApiError";
import { asyncHandler } from "../util/asyncHandler";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(
    async (req, res, next) => {
        const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "");

        if(!token) throw new ApiError(401, "Unauthorized Request");

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        );

        if(!user) throw new ApiError(401, "Invalid Token");

        res.user = user;

        next()
    }
)