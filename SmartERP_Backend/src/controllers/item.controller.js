import { application } from "express";
import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createItem = asyncHandler(async (req, res) => {
    const { item_name, sku, brand, category_id, unit_id, gst_percentage, default_purchase_price, default_selling_price, current_quantity, status } = req.body

    const { company_id } = req.params

    if ([company_id, item_name, sku, brand, category_id, unit_id, gst_percentage, default_purchase_price, default_selling_price, current_quantity, status]
        .some(field =>
            field === undefined ||
            field === null ||
            (typeof field === "string" && field.trim() === "")
        )) {
        throw new ApiError(400, "All fields are required");
    }

    const result = await pool.query("select * from item where sku=$1 and company_id=$2", [sku, company_id])

    if (result.rows.length > 0) {
        throw new ApiError(409, "sku already exists")
    }

    const result2 = await pool.query("insert into item(company_id,item_name,sku, brand,category_id,unit_id, gst_percentage, default_purchase_price, default_selling_price, current_quantity, status) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11) returning *", [company_id, item_name, sku, brand, category_id, unit_id, gst_percentage, default_purchase_price, default_selling_price, current_quantity, status])

    const result3 = result2.rows[0]

    return res
        .status(201)
        .json(new ApiResponse(201, { result3 }, "item created successfully"))


})

const getItems = asyncHandler(async (req, res) => {

    const { company_id } = req.params
    const result = await pool.query("select * from item where company_id=$1", [company_id])
    if (result.rows.length === 0) {
        throw new ApiError(404, "No items found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result.rows, "Items fetched successfully"))


})

const getOneItem = asyncHandler(async (req, res) => {
    const { company_id, item_id } = req.params

    const result = await pool.query("select * from item where item_id=$1 and company_id=$2", [item_id, company_id])

    if (result.rows.length === 0) {
        throw new ApiError(404, "Item not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result.rows[0], "Item fetched successfully"))
})

const update = asyncHandler(async (req, res) => {

    const { item_name, sku, brand, category_id, unit_id, gst_percentage, default_purchase_price, default_selling_price, status } = req.body

    const { company_id, item_id } = req.params

    if ([company_id, item_name, sku, brand, category_id, unit_id, gst_percentage, default_purchase_price, default_selling_price, status]
        .some(field =>
            field === undefined ||
            field === null ||
            (typeof field === "string" && field.trim() === "")
        )) {
        throw new ApiError(400, "All fields are required");
    }

    const result = await pool.query("select * from item where company_id=$1 and sku=$2 and item_id<>$3", [company_id, sku, item_id])

    if (result.rows.length > 0) {
        throw new ApiError(409, "Sku already exists")
    }

    const result2 = await pool.query("update item set item_name=$1, sku=$2, brand=$3, category_id=$4, unit_id=$5, gst_percentage=$6, default_purchase_price=$7,default_selling_price=$8,status=$9 where company_id=$10 and item_id=$11 returning *", [item_name, sku, brand, category_id, unit_id, gst_percentage, default_purchase_price, default_selling_price, status, company_id, item_id])

    return res
        .status(200)
        .json(new ApiResponse(200, result2.rows[0], "Update successful"))
})
