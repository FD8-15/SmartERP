import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createVoucher = asyncHandler(async (req, res) => {
    const { company_id, customer_id, contact_no } = req.params
    const { date, items } = req.body
    const client = await pool.connect()
    try {
        await client.query("begin")
        const result = await client.query("select * from customers where contact_no=$1 and company_id=$2", [contact_no, company_id])

        if (result.rows.length === 0) {
            throw new ApiError(400, "No customer found")
        }

        let total_amt = 0
        const proccesedItems = []
        
        for (const item of items) {
            const { item_id, qty } = item
            const result2 = await client.query("select * from items where item_id=$1 and company_id=$2", [item_id, company_id])

            if (result2.rows.length === 0) {
                throw new ApiError(400, "No item found")
            }
            const current_quantity = result2.rows[0].current_quantity
            if (qty > current_quantity) {
                throw new ApiError(400, "cannot sell more then current quantity")
            }
            const default_selling_price = result2.rows[0].default_selling_price
            const line_total = qty * default_selling_price
            total_amt = total_amt + line_total

            proccesedItems.push([current_quantity, item_id, qty, line_total])
        }

        const result3 = await client.query("insert into sales_voucher(company_id,customer_id,total_amt,date) values($1,$2,$3,$4) returning *", [company_id, customer_id, total_amt, date])

        const sales_id = result3.rows[0].sales_id

        for (const item of proccesedItems) {
            const [current_quantity, item_id, qty, line_total] = item

            await client.query("insert into sales_voucher_items(sales_id,item_id,qty,total_amt) values($1,$2,$3,$4)", [sales_id, item_id, qty, line_total])

            const newCurrentQuantity = current_quantity - qty

            await client.query("update items set current_quantity=$1 where item_id=$2 and company_id=$3 ", [newCurrentQuantity, item_id, company_id])
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