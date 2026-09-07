import { asyncHandler } from "../utils/asyncHandler";
import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError";

const createReceipt = asyncHandler(async (req, res) => {
    const { company_id, sales_id } = req.params
    const { connect_no, current_amt_paid, date, mode } = req.body
    const client = await pool.connect()

    try {

        await client.query("begin")
        let remaining_amt

        const salesVoucher = await client.query("select * from sales_voucher where sales_id=$1 and company_id=$2", [sales_id, company_id])

        if (salesVoucher.rows.length === 0) {
            throw new ApiError(404, "Sales voucher not found")
        }

        const voucherTotal = salesVoucher.rows[0].total_amt

        const customer = await client.query("select * from customers where company_id=$1 and contact_no=$2", [company_id, connect_no])

        if (customer.rows.length === 0) {
            throw new ApiError(400, "Customer not found")
        }
        const customer_id = customer.rows[0].customer_id

        const paidTotalAmt = await client.query("SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM receipt_vouchers WHERE company_id=$1 AND sales_id=$2 AND customer_id=$3", [company_id, sales_id, customer_id])

        remaining_amt = voucherTotal - paidTotalAmt.total_paid
        if (current_amt_paid > remaining_amt) {
            throw new ApiError(400, "cannot pay more then remaining amount")
        }

        const result = await client.query("insert into receipt_voucher(company_id,customer_id,sales_id,  amount_paid,date,mode) values($1,$2,$3,$4,$5,$6) returning *", [company_id, customer_id, sales_id, current_amt_paid, date, mode])


        await client.query("commit")


    } catch (error) {
        await client.query("rollback")
        throw error
    } finally {
        client.release()
    }

    return res
        .status(201)
        .json(new ApiResponse(201, { voucher: result.rows[0] }, "Success"))
})

const update = asyncHandler(async (req, res) => {
    const { company_id, sales_id, receipt_id } = req.params
    const { connect_no, current_amt_paid } = req.body
    const client = await pool.connect()

    try {
        await client.query("begin")
        let remaining_amt
        const salesVoucher = await client.query("select * from sales_voucher where sales_id=$1 and company_id=$2", [sales_id, company_id])


        if (salesVoucher.rows.length === 0) {
            throw new ApiError(404, "Sales voucher not found")
        }

        const voucherTotal = salesVoucher.rows[0].total_amt

        const customer = await client.query("select * from customers where company_id=$1 and contact_no=$2", [company_id, connect_no])

        if (customer.rows.length === 0) {
            throw new ApiError(400, "Customer not found")
        }
        const customer_id = customer.rows[0].customer_id

        const paidTotalAmt = await client.query("SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM receipt_vouchers WHERE company_id=$1 AND sales_id=$2 AND customer_id=$3 and receipt_id<>$4", [company_id, sales_id, customer_id, receipt_id])

        remaining_amt = voucherTotal - paidTotalAmt.rows[0].total_paid

        if (current_amt_paid > remaining_amt) {
            throw new ApiError(400, "cannot pay more then remaining amount")
        }

        const result = await client.query("update receipt_voucher set amount_paid=$1 where receipt_id=$2 and company_id=$3 and customer_id=$4 and sales_id=$5 returning *", [current_amt_paid, receipt_id, company_id, customer_id, sales_id]
        )

        await client.query("commit")

    } catch (error) {

        await client.query("rollback")
        throw error
    } finally {
        client.release()
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Success"))
})

const getAllVouchers = asyncHandler(async (req, res) => {
    const { company_id } = req.params

    const result = await pool.query("select * from receipt_voucher where company_id=$1")


    if (result.rows.length === 0) {
        throw new ApiError(404, "Vouchers not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, { voucher: result.rows }, "Success"))

})

