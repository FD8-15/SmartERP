import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";

// Tested !!!

const register = asyncHandler(async (req, res) => {

    const { name, email, password, role } = req.body

    if (!name || !email || !password || !role) {
        throw new ApiError(400, "All feilds are required")
    }

    const existingUser = await pool.query("select email from users where email=$1", [email])
    if (existingUser.rows.length > 0) {
        throw new ApiError(400, "User already registered")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query('insert into users(name,email,password,role) values($1,$2,$3,$4) RETURNING user_id, name, email, role', [name, email, hashedPassword, role])

    return res
        .status(201)
        .json(new ApiResponse(201, result.rows[0], "Success"))

})

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if ([email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All filds are required")
    }

    const result = await pool.query('select user_id,name,email,password,refresh_token from users where email=$1', [email])

    if (result.rows.length === 0) {
        throw new ApiError(400, "User email or password is invalid")
    }

    const user = result.rows[0]

    const checkPassword = await bcrypt.compare(password, user.password)
    if (!checkPassword) {
        throw new ApiError(400, "User email or password is invalid")
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    const save_token = await pool.query("update users set refresh_token=$1 where user_id=$2", [refreshToken, user.user_id])

    const { password: _, ...loggedInUser } = user;

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            success: true,
            user: loggedInUser,
            accessToken,
            refreshToken
        })
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken

    if (!token) {
        throw new ApiError(401, "Please Login")
    }

    let decodedToken

    try {
        decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token")
    }

    if (
        !decodedToken ||
        typeof decodedToken !== "object" ||
        !decodedToken.user_id
    ) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const userId = decodedToken.user_id

    const result = await pool.query("select user_id,name,email,role,refresh_token from users where user_id=$1", [userId])

    if (result.rows.length === 0) {
        throw new ApiError(401, "User not found")
    }

    const user = result.rows[0]

    if (user.refresh_token !== token) {
        throw new ApiError(401, "Refresh token is invalid or expired")
    }

    const accessToken = generateAccessToken(user)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .json({
            success: true,
            accessToken
        })

})

const logout = asyncHandler(async(req,res)=>{
    const userId = req.user.user_id

    const result = await pool.query("update users set refresh_token=null where user_id=$1",[userId])

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({
        success:true,
        message:"User logged out successfully"
    })
})

export {register,login,logout}