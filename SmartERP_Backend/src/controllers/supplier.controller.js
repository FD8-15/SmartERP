import { json } from "express";
import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createSupplier = asyncHandler(async (req, res) => {

    const { company_id } = req.params

    const { name, contact_no, email, address, gst_no } = req.body

    if ([name, contact_no, email, address, gst_no]
        .some(field =>
            field === undefined ||
            field === null ||
            (typeof field === "string" && field.trim() === "")
        )) {
        throw new ApiError(400, "All fields are required");
    }

    const result = await pool.query("select * from suppliers where gst_no=$1 and company_id=$2 ", [gst_no, company_id])

    if (result.rows.length > 0) {
        throw new ApiError(409, "Supplier already exists")
    }

    const result2 = await pool.query("insert into suppliers(company_id,name, contact_no, email, address,gst_no) values($1,$2,$3,$4,$5,$6) returning *", [company_id, name, contact_no, email, address, gst_no])

    return res
        .status(201)
        .json(new ApiResponse(201, { supplier: result2.rows[0] }, "Supplier created successfully"))



})

const getAllSupplier = asyncHandler(async (req, res) => {
    const { company_id } = req.params

    const result = await pool.query("select * from suppliers where company_id=$1 ", [company_id])

    return res
        .status(200)
        .json(new ApiResponse(200, { suppliers: result.rows }, "Suppliers fetched successful"))
})

const getOneSupplier = asyncHandler(async (req, res) => {
    const { company_id, supplier_id } = req.params

    const result = await pool.query("select * from suppliers where supplier_id=$1 and company_id=$2", [supplier_id, company_id])

    if (result.rows.length === 0) {
        throw new ApiError(404, "Supplier does not exists now!!")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { supplier: result.rows[0] }, "Supplier fetched successfully"))


})

const updateSupplier = asyncHandler(async (req, res) => {
    const { company_id,supplier_id } = req.params
    const { name, contact_no, email, address, gst_no } = req.body

    if ([name, contact_no, email, address, gst_no]
        .some(field =>
            field === undefined ||
            field === null ||
            (typeof field === "string" && field.trim() === "")
        )) {
        throw new ApiError(400, "All fields are required");
    }

    const result = await pool.query("select * from suppliers where company_id = $1 and gst_no=$2 and supplier_id<>$3", [company_id, gst_no,supplier_id])

    if (result.rows.length > 0) {
        throw new ApiError(409, "Already exists")
    }

    const result2 = await pool.query("update suppliers set name=$1,contact_no=$2,email=$3,address=$4,gst_no=$5 where company_id=$6 and supplier_id=$7 returning *", [name, contact_no, email, address, gst_no,company_id,supplier_id])

    return res
        .status(200)
        .json(new ApiResponse(200, { supplierUpdated: result2.rows[0] }, "Supplier updated successfully"))
})