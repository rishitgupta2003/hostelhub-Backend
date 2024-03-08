import { asyncHandler } from "../util/asyncHandler.js";

const register = asyncHandler(
    async (req, res) => {
        res.status(200).json({
            msg : "ok"
        });
    }
)