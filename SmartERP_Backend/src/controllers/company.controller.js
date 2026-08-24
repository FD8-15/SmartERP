import { asyncHandler } from "../utils/asyncHandler.js";
import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createCompany = asyncHandler(async (req, res) => {
    const { company_name, email, address, contact_number, state, gst_no, financial_year_start, financial_year_end } = req.body

    if ([company_name, email, address, contact_number, state, gst_no, financial_year_start, financial_year_end].some((feilds) => !feilds?.trim())) {
        throw new ApiError(400, "All feilds are required")
    }

    const user = req.user.user_id

    if (!user) {
        throw new ApiError(400, "Please login")
    }

    const result = await pool.query("select count(*) company_id from company_users where user_id=$1 and role='owner' ", [user])

    if (Number(result.rows[0].count) >= 5) {
        throw new ApiError(400, "Perticular user cannot create more then 5 companies")
    }
    // This is used to check company is already exists or not 
    const check_company = await pool.query(
        "SELECT c.company_id FROM companies c JOIN company_users cu ON c.company_id = cu.company_id WHERE cu.user_id=$1 AND cu.role='owner' AND LOWER(TRIM(c.company_name)) = LOWER(TRIM($2))", [user, company_name]
    )

    if (check_company.rows.length > 0) {
        throw new ApiError(400, "You cannot create company with same name")
    }

    const insert = await pool.query("insert into companies(company_name, email, address, contact_number, state, gst_no, financial_year_start, financial_year_end) values($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *", [company_name, email, address, contact_number, state, gst_no, financial_year_start, financial_year_end])

    const getcompany_id = insert.rows[0].company_id

    const result2 = await pool.query("insert into company_users(user_id,company_id,role) values($1,$2,$3) returning * ", [user, getcompany_id, "owner"])

    const resp = insert.rows[0]
    return res
        .status(201)
        .json(new ApiResponse(201, { resp }, "Company created succsfully"))

})

const getAllCompany = asyncHandler(async (req, res) => {
    const user = req.user.user_id

    if (!user) {
        throw new ApiError(400, "Please Login")
    }

    const result = await pool.query("select c.company_name,u.company_id from companies c join company_users u on c.company_id = u.company_id where u.user_id=$1 ", [user])

    if (result.rows.length === 0) {
        throw new ApiError(400, "No companies found !!")
    }

    const result2 = result.rows
    return res
        .status(200)
        .json(new ApiResponse(200, { result2 }, "success"))
})

const getCompany = asyncHandler(async (req, res) => {
    const { company_id } = req.body

    const user = req.user.user_id

    if (!user) {
        throw new ApiError(400, "Please Login")
    }

    const result = await pool.query("select c.* from companies c join company_users cu on c.company_id = cu.company_id where cu.user_id=$1 and cu.company_id=$2", [user, company_id])

    if (result.rows.length === 0) {
        throw new ApiError(400, "No companies found")
    }

    const result2 = result.rows[0]

    return res
        .status(200)
        .json(new ApiResponse(200, { result2 }, "success"))
})

const addToCompany = asyncHandler(async (req, res) => {

    const { email, role } = req.body
    const { company_id } = req.params

    const owner = req.user.user_id

    if (!owner) {
        throw new ApiError(401, "Please login")
    }

    // 1. Check whether logged-in user is owner of THIS company
    const checkOwner = await pool.query("SELECT * FROM company_users WHERE user_id=$1 AND company_id=$2 AND role='owner'", [owner, company_id]
    )

    if (checkOwner.rows.length === 0) {
        throw new ApiError(403, "Only company owner can add users")
    }

    // 2. Validate email and role
    if (!email?.trim() || !role?.trim()) {
        throw new ApiError(400, "Email and role are required")
    }

    const newRole = role.trim().toLowerCase()

    // 3. Only these roles can be assigned
    if (!["manager", "employee"].includes(newRole)) {
        throw new ApiError(400, "Invalid role")
    }

    // 4. Find the user
    const result = await pool.query("SELECT user_id FROM users WHERE email=$1", [email.trim()]
    )

    const user = result.rows[0]?.user_id

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // 5. Check whether user is already in this company
    const checkExisting = await pool.query("SELECT * FROM company_users WHERE user_id=$1 AND company_id=$2", [user, company_id]
    )

    if (checkExisting.rows.length > 0) {
        throw new ApiError(400, "User already belongs to this company")
    }

    // 6. Add user to company
    const result2 = await pool.query("INSERT INTO company_users(user_id, company_id, role) VALUES($1,$2,$3) RETURNING *", [user, company_id, newRole]
    )

    const result3 = result2.rows[0]

    return res
        .status(201)
        .json(new ApiResponse(201, { result3 }, "User added successfully to company"))
})

const updateCompany = asyncHandler(async (req, res) => {

    const { company_name, email, address, contact_number, state, gst_no, financial_year_start, financial_year_end } = req.body

    const {company_id}=req.params

    if ([company_name, email, address, contact_number, state, gst_no, financial_year_start, financial_year_end].some((feilds) => !feilds?.trim())) {
        throw new ApiError(400, "All feilds are required")
    }

    const user = req.user.user_id
    if (!user) {
        throw new ApiError(400, "Please login")
    }

    const check_company = await pool.query("SELECT c.company_id, c.company_name FROM companies c join company_users cu on c.company_id = cu.company_id WHERE cu.user_id=$1 and cu.role='owner' and LOWER(TRIM(c.company_name))=LOWER(TRIM($2)) AND c.company_id<>$3", [user, company_name, company_id])

    if (check_company.rows.length > 0) {
        throw new ApiError(400, "You already have a company with this name");
    }

    const result = await pool.query("update  companies set company_name=$1, email=$2, address=$3, contact_number=$4, state=$5, gst_no=$6, financial_year_start=$7, financial_year_end=$8 where company_id=$9 returning *", [company_name, email, address, contact_number, state, gst_no, financial_year_start, financial_year_end, company_id])

    if (result.rows.length === 0) {
        throw new ApiError(400, "Company not found ")
    }

    const result2 = result.rows[0]
    return res
        .status(200)
        .json(new ApiResponse(200, { result2 }, "Update successful"))

})

export {createCompany,getAllCompany,getCompany,addToCompany,updateCompany}