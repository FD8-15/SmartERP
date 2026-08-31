import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPaymentVoucher = asyncHandler(async (req, res) => {
    const { paid_amt, date, mode } = req.body
    const { company_id, voucher_id, supplier_id } = req.params
    const client = await pool.connect()

    try {
        await client.query("begin")
        let remainingAmt

        const purchase_voucher = await client.query("select * from purchase_voucher where company_id=$1 and voucher_id=$2 and supplier_id=$3", [company_id, voucher_id, supplier_id])

        if (purchase_voucher.rows.length === 0) {
            throw new ApiError(400, "No voucher found")
        }

        const paidAmt = await client.query("SELECT COALESCE(SUM(amount_paid), 0) AS total_paid FROM payment_voucher WHERE company_id=$1 AND voucher_id=$2 AND supplier_id=$3", [company_id, voucher_id, supplier_id])

        remainingAmt = purchase_voucher.rows[0].total_amt - paidAmt.rows[0].total_paid

        if (paid_amt > remainingAmt) {
            throw new ApiError(400, "Cannot pay more than outstanding amount")
        }

        await client.query("insert into payment_voucher(company_id,supplier_id,voucher_id,  amount_paid,date,mode) values($1,$2,$3,$4,$5,$6)", [company_id, supplier_id, voucher_id, paid_amt, date, mode])

        await client.query("commit")

    } catch (error) {
        await client.query("rollback")
        throw error
    } finally {
        client.release()
    }

    return res
        .status(201)
        .json(new ApiResponse(201, {}))
})

const getOneVoucher = asyncHandler(async (req, res) => {
    const { voucher_id, company_id, payment_id, supplier_id } = req.params

    const result = await pool.query("select * from payment_voucher where payment_id=$1 and company_id=$2 and voucher_id=$3 and supplier_id=$4", [payment_id, company_id, voucher_id, supplier_id])

    if (result.rows.length === 0) {
        throw new ApiError(404, "Voucher not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { voucher: result.rows[0] }, "Success"))
})

const getAllPaymentsByPurchaseVoucher = asyncHandler(async (req, res) => {
    const { voucher_id, company_id, supplier_id } = req.params


    const result = await pool.query("select * from payment_voucher where  company_id=$1 and voucher_id=$2 and supplier_id=$3", [company_id, voucher_id, supplier_id])

    if (result.rows.length === 0) {
        throw new ApiError(404, "Vouchers not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { voucher: result.rows }, "Success"))

})

const getAllVouchers = asyncHandler(async (req, res) => {
    const { company_id } = req.params


    const result = await pool.query("select * from payment_voucher where  company_id=$1 ", [company_id])

    if (result.rows.length === 0) {
        throw new ApiError(404, "Vouchers not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { voucher: result.rows }, "Success"))
})