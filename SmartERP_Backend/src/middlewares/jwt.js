import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const auth = asyncHandler(async (req, res, next) => {

    const token = req.cookies?.accessToken

    if (!token) {
        throw new ApiError(401, "Please Login")
    }

    let decoded_token
    try {
        decoded_token = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token ")
    }

    if (
        !decoded_token ||
        typeof decoded_token !== "object" ||
        !decoded_token.user_id
    ) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = decoded_token
    next();

})