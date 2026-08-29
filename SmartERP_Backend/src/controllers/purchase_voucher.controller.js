import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createVoucher = asyncHandler(async (req, res) => {

    const { date, gst_no, items } = req.body

    const { company_id } = req.params

    const result = await pool.query("select * from suppliers where gst_no=$1 and company_id=$2", [gst_no, company_id])

    if (result.rows.length === 0) {
        throw new ApiError(400, "Supplier not found")
    }

    const supplier_id = result.rows[0].supplier_id
    const client = await pool.connect();

    try {
        await client.query("begin")

        let total_amt = 0
        const processedItems = []

        for (const item of items) {
            const { item_id, qty } = item

            const result3 = await client.query("select * from item where item_id=$1 and company_id=$2", [item_id, company_id])

            if (result3.rows.length === 0) {
                throw new ApiError(400, "item not found")
            }

            const current_quantity = result3.rows[0].current_quantity

            const line_total = qty * result3.rows[0].default_purchase_price
            total_amt += line_total

            processedItems.push([
                item_id, qty, line_total, current_quantity
            ])
        }

        const result4 = await client.query("insert into purchase_voucher(company_id,supplier_id,date,total_amt) values($1,$2,$3,$4) returning *", [company_id, supplier_id, date, total_amt])

        const voucher_id = result4.rows[0].voucher_id


        for (const item of processedItems) {
            const [item_id, qty, line_total, current_quantity] = item

            const result5 = await client.query("insert into purchase_voucher_items(voucher_id,item_id,qty,total_amt) values($1,$2,$3,$4) returning *", [voucher_id, item_id, qty, line_total])

            const newCurrentQty = current_quantity + qty
            const result7 = await client.query("update item set current_quantity=$1 where company_id=$2 and item_id=$3", [newCurrentQty, company_id, item_id])

        }
        await client.query("commit")

    } catch (error) {
        await client.query("rollback")
        throw error

    } finally {
        client.release()
    }

    return res
        .status(201)
        .json(new ApiResponse(201, "success"))
})

const getAllVouchers = asyncHandler(async (req, res) => {
    const { company_id } = req.params

    const result = await pool.query("select * from purchase_voucher where company_id=$1", [company_id])

    return res
        .status(200)
        .json(new ApiResponse(200, { AllVouchers: result.rows }, "Success"))
})

const getOneVoucher = asyncHandler(async (req, res) => {
    const { company_id, voucher_id } = req.params

    //Need to test this in pg admin for differnt endpoints
    const result = await pool.query("select p.*,i.* from purchase_voucher p join purchase_voucher_items i on p.voucher_id = i.voucher_id where p.company_id=$1 and p.voucher_id=$2 ", [company_id, voucher_id])

    if (result.rows.length === 0) {
        throw new ApiError(400, "Voucher not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { Voucher: result.rows }, "Success"))


})

const upadate = asyncHandler(async (req, res) => {
    const { voucher_id, company_id } = req.params
    const { items } = req.body

    const client = await pool.connect();
    try {
        await client.query("begin")

        const result = await client.query("select * from purchase_voucher where company_id=$1 and voucher_id=$2", [company_id, voucher_id])

        if (result.rows.length === 0) {
            throw new ApiError(400, "Voucher not found")
        }

        const result2 = await client.query("select * from purchase_voucher_items where voucher_id=$1", [voucher_id])

        const oldItems = result2.rows

        for (const newItems of items) {
            const { item_id, qty } = newItems

            const oldItem = oldItems.find(
                oldItem => oldItem.item_id === newItems.item_id
            )

            if (oldItem) {
                const difference = newItems.qty - oldItem.qty
                await client.query("update item set current_quantity=current_quantity + $1 where item_id=$2 and company_id=$3", [difference, item_id, company_id])

            } else {

                const current_quantity = await client.query("select current_quantity from item where item_id=$1 and company_id=$2", [item_id, company_id])

                const newCurrentQuantity = current_quantity.rows[0].current_quantity + qty

                await client.query("update item set current_quantity=$1 where item_id=$2 and company_id=$3", [newCurrentQuantity, item_id, company_id])
            }
        }

        for (const item of oldItems) {
            const newItem = items.find(
                newItem => newItem.item_id === item.oldItems.item_id
            )

            if (!newItem) {
                const qty = item.qty
                const item_id = item.item_id
                await client.query("update item set current_quantity=current_quantity - $1 where item_id=$2 and company_id=$3", [qty, item_id, company_id])
            }

        }

        for (const newItem of items) {
            const oldItem = oldItems.find(
                oldItem => oldItem.item_id === newItem.item_id
            )
            if (oldItem) {
                const item_id = oldItem.item_id
                const newQty = newItem.qty

                const purchase_price = await client.query("select default_purchase_price from item where item_id=$1 and company_id=$2", [item_id, company_id])

                const newLineTot = purchase_price.rows[0].default_purchase_price * newQty

                await client.query("update purchase_voucher_items set qty=$1,total_amt=$2 where voucher_id=$3 and item_id=$4", [newQty, newLineTot, voucher_id, item_id])
            } else {
                const item_id = newItem.item_id
                const newQty = newItem.qty

                const purchase_price = await client.query("select default_purchase_price from item where item_id=$1 and company_id=$2", [item_id, company_id])

                const total_amt = purchase_price.rows[0].default_purchase_price * newQty

                await client.query("insert into purchase_voucher_items(voucher_id,item_id,qty,total_amt) values($1,$2,$3,$4)", [voucher_id, item_id, newQty, total_amt])
            }

        }





    } catch (error) {

    }
})