import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkRole = (...allowedRoles)=>
asyncHandler(async(req,res,next)=>{

    const userRole = req.companyRole
    if(!allowedRoles.includes(userRole)){
        throw new ApiError(403,"You are not authorized")
    }

    next();
})
