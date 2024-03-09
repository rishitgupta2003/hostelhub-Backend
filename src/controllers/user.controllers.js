import { asyncHandler } from "../util/asyncHandler.js";

const registerUser = asyncHandler(
    async (req, res) => {
        res.send("Hello World");
    }
)

export { registerUser }