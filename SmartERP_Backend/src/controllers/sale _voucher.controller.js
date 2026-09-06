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

const getAllVouchers = asyncHandler(async (req, res) => {
    const { company_id } = req.params

    const result = await pool.query("select * from sales_voucher where company_id=$1", [company_id])

    return res
        .status(200)
        .json(new ApiResponse(200, { Vouchers: result.rows }, "All vouchers fetched successfully"))
})

const getOneVoucher = asyncHandler(async (req, res) => {
    const { company_id, sales_id } = req.params

    const result = await pool.query("select s.*,si.* from sales_voucher s join sales_voucher_items si on s.sales_id = si.sales_id where s.company_id=$1 and s.sales_id=$2", [company_id, sales_id])

    if (result.rows.length === 0) {
        throw new ApiError(400, "Voucher not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { Vouchers: result.rows[0] }, "voucher fetched successfully"))
})

const update = asyncHandler(async (req, res) => {
    const { company_id, sales_id } = req.params
    const { items } = req.body

    const client = await pool.connect()

    try {
        await client.query("begin")

        const result = await client.query("select * from sales_voucher where sales_id=$1 and company_id=$2", [sales_id, company_id])

        if (result.rows.length === 0) {
            throw new ApiError(400, "Voucher not found")
        }

        const result2 = await client.query("select * from sales_voucher_items where sales_id=$1 ", [sales_id])

        const oldItems = result2.rows

        for (const newItem of items) {
            const { item_id, qty } = newItem
            const oldItem = oldItems.find(
                oldItems => oldItems.item_id === newItem.item_id
            )
            if (oldItem) {
                const difference = newItem.qty - oldItem.qty
                const result4 = await client.query("update items set current_quantity=current_quantity + $1 where item_id=$2 and company_id=$3", [difference, item_id, company_id])

            } else {
                const result5 = await client.query("select * from items where item_id=$1 and company_id=$2", [item_id, company_id])

                const newCurrentQuantity = result5.rows[0].current_quantity - qty

                await client.query("update items set current_quantity=$1 where item_id=$2 and company_id=$3", [newCurrentQuantity, item_id, company_id])
            }
        }

        for (const oldItem of oldItems) {
            const newItem = items.find(
                newItem => newItem.item_id === oldItem.item_id
            )
            if (!newItem) {
                const item_id = oldItem.item_id
                const result6 = await client.query("select * from items where item_id=$1 and company_id=$2", [item_id, company_id])
                const newCurrentQuantity = result6.rows[0].current_quantity + oldItem.qty
                await client.query("update items set current_quantity=$1 where item_id=$2 and company_id=$3", [newCurrentQuantity, item_id, company_id])
            }
        }

        for (const newItem of items) {
            const { qty, item_id } = newItem
            const oldItem = oldItems.find(
                oldItem => newItem.item_id === oldItem.item_id
            )
            if (oldItem) {
                const item = await client.query("select * from items where item_id=$1 and company_id=$2", [item_id, company_id])
                const line_tot = item.rows[0].default_selling_price * qty
                await client.query("update sales_voucher_items set qty=$1,total_amt=$2 where item_id=$3 and sales_id=$4", [qty, line_tot, item_id, sales_id])
            } else {
                const result7 = await client.query("select * from items where item_id=$1 and company_id=$2", [item_id, company_id])
                const line_tot = result7.rows[0].default_selling_price * qty
                await client.query("insert into sales_voucher_items (sales_id, item_id, qty, total_amt) values($1,$2,$3,$4)", [sales_id, item_id, qty, line_tot])
            }

        }

        for (const oldItem of oldItems) {
            const newItem = oldItems.find(
                newItem => newItem.item_id === oldItem.item_id
            )
            if (!newItem) {
                const item_id = oldItem.item_id
                await client.query("DELETE FROM sales_voucher_items where sales_id=$1 and item_id=$2", [sales_id, item_id])
            }
        }

        let total_amt = 0
        for (const newItem of items) {
            const item_id = newItem.item_id
            const result8 = await client.query("select * from items where item_id=$1 and company_id=$2", [item_id, company_id])
            const line_tot = result8.rows[0].default_selling_price * newItem.qty
            total_amt = total_amt + line_tot

        }
        await client.query("update sales_voucher set total_amt=$1 where company_id=$2 and sales_id=$3", [total_amt, company_id, sales_id])
        await client.query("commit")
    } catch (error) {

        await client.query("rollback")
        throw error
    } finally {
        client.release()
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "success"))

})