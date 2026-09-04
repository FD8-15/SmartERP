import pool from "../db/db";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

const createCustomer = asyncHandler(async (req, res) => {
    const { name, contact_no } = req.body
    const { company_id } = req.params

    if ([name, contact_no]
        .some(field =>
            field === undefined ||
            field === null ||
            (typeof field === "string" && field.trim() === "")
        )) {
        throw new ApiError(400, "All fields are required");
    }

    const result = await pool.query("select * from customers where company_id=$1 and contact_no=$2", [company_id, contact_no])

    if (result.rows.length > 0) {
        throw new ApiError(409, "Customer already exists")
    }

    const result2 = await pool.query("insert into customers(company_id,name,contact_no) values($1,$2,$3)  returning *")

    return res
        .status(201)
        .json(new ApiResponse(201, { Customer: result2.rows[0] }, "Customer created successfully"))
})

const getAllCustomers = asyncHandler(async (req, res) => {
    const { company_id } = req.params

    const result = await pool.query("select * from customers where company_id=$1 ", [company_id])

    return res
        .status(200)
        .json(new ApiResponse(200, { suppliers: result.rows }, "customers fetched successful"))
})

const getOneCustomers = asyncHandler(async (req, res) => {
    const { company_id, customer_id } = req.params

    const result = await pool.query("select * from customers where customer_id=$1 and company_id=$2", [customer_id, company_id])

    if (result.rows.length === 0) {
        throw new ApiError(404, "customer does not exists now!!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { customer: result.rows[0] }, "customer fetched successfully"))

})
