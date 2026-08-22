import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const company_access = asyncHandler(async(req,res,next)=>{
    const {company_id}=req.params

    const user  = req.user.user_id

    if(!user || !company_id){
        throw new ApiError(403,"Please Login")
    }

    const result = await pool.query("select * from company_users where user_id=$1 and company_id=$2",[user,company_id])

    if(result.rows.length===0){

        throw new ApiError(400,"You are not authorized")
    }

    req.companyRole = result.rows[0].role
    next()

})