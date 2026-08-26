import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError";
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

        const result2 = await client.query("select * from suppliers where supplier_id=$1 and company_id=$2", [supplier_id, company_id])

        if (result2.rows.length === 0) {
            throw new ApiError(400, "Supplier not found")
        }

        let total_amt = 0

        for (const item of items) {
            const { item_id, qty } = item

            const result3 = await client.query("select * from item where item_id=$1 and company_id=$2", [item_id, company_id])

            if (result3.rows.length === 0) {
                throw new ApiError(400, "item not found")
            }

            const line_total = qty * result3.rows[0].deafult_purchase_price
            total_amt += line_total
        }

        const result4 = await client.query("insert into purchase_voucher(company_id,supplier_id,date,total_amt) values($1,$2,$3,$4) returning *", [company_id, supplier_id, date, total_amt])

        const voucher_id = result4.rows[0].voucher_id


        for (const item of items) {
            const { item_id, qty, line_total } = item

            const result5 = await client.query("insert into purchase_voucher_items(voucher_id,item_id,qty,total_amt) values($1,$2,$3,$4) returning *", [voucher_id, item_id, qty, line_total])

            const result6 = await client.query("select current_quantity from item where item_id=$1 ", [item_id])

            const current_quantity = result6.rows[0].current_quantity + qty

            const result7 = await client.query("update item set current_quantity=$1 where item_id=$2", [current_quantity, item_id])

        }

    } catch (error) {

    }

})