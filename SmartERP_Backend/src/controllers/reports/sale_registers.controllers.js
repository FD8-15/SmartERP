import pool from "../../db/db";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";

 export const salesRegister = asyncHandler(async (req, res) => {

    const { company_id } = req.params
    const { date_from, date_to } = req.query;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const result = await pool.query("select s.* from sale_vouchers s  where s.date between $1 and $2 and s.company_id=$3 order by s.date ASC limit $4 offset $5", [date_from, date_to, company_id, limit,offset])

    const totalResult = await pool.query("SELECT COUNT(*) FROM sale_vouchers WHERE company_id = $1 AND date BETWEEN $2 AND $3", [company_id, date_from, date_to]
    );

    const totalRecords = Number(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            vouchers: result.rows, pagination: {
                page,
                limit,
                totalRecords,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        }, "Vouchers fetched successfully"))
})

export const salesSummary = asyncHandler(async (req, res) => {

    const { company_id } = req.params;
    const { date_from, date_to } = req.query;

    const result = await pool.query(
        `SELECT
            COUNT(s.sales_id) AS total_vouchers,
            COALESCE(SUM(s.total_amt), 0) AS total_sales,
            COALESCE(SUM(r.amount_paid), 0) AS total_received
         FROM sales_voucher s
         LEFT JOIN (
            SELECT sales_id, SUM(amount_paid) AS amount_paid
            FROM receipt_vouchers
            GROUP BY sales_id
         ) r ON r.sales_id = s.sales_id
         WHERE s.company_id = $1
         AND s.date BETWEEN $2 AND $3`,
        [company_id, date_from, date_to]
    );

    const data = result.rows[0];

    const totalSales = Number(data.total_sales);
    const totalReceived = Number(data.total_received);
    const outstanding = totalSales - totalReceived;
    const totalVouchers = Number(data.total_vouchers);

    return res.status(200).json(
        new ApiResponse(200, {
            totalVouchers,
            totalSales,
            totalReceived,
            outstanding,
            averageBillValue: totalVouchers
                ? totalSales / totalVouchers
                : 0
        }, "Sales summary fetched successfully")
    );
});
export const salesOutstanding = asyncHandler(async (req, res) => {

    const { company_id } = req.params;
    const { date_from, date_to } = req.query;

    const result = await pool.query(
        `SELECT
            s.sales_id,
            s.date,
            c.customer_id,
            c.name AS customer_name,
            s.total_amt,
            COALESCE(r.total_received, 0) AS total_received,
            s.total_amt - COALESCE(r.total_received, 0) AS outstanding
         FROM sales_voucher s
         JOIN customers c
            ON c.customer_id = s.customer_id
         LEFT JOIN (
            SELECT sales_id, SUM(amount_paid) AS total_received
            FROM receipt_vouchers
            GROUP BY sales_id
         ) r ON r.sales_id = s.sales_id
         WHERE s.company_id = $1
         AND s.date BETWEEN $2 AND $3
         AND s.total_amt > COALESCE(r.total_received, 0)
         ORDER BY s.date ASC`,
        [company_id, date_from, date_to]
    );

    return res.status(200).json(
        new ApiResponse(200, {
            outstandingVouchers: result.rows
        }, "Outstanding report fetched successfully")
    );
});

export const customerWiseSales = asyncHandler(async (req, res) => {

    const { company_id } = req.params;
    const { date_from, date_to } = req.query;

    const result = await pool.query(
        `SELECT
            c.customer_id,
            c.name AS customer_name,
            COUNT(s.sales_id) AS total_vouchers,
            COALESCE(SUM(s.total_amt), 0) AS total_sales,
            COALESCE(SUM(r.total_received), 0) AS total_received,
            COALESCE(SUM(s.total_amt - COALESCE(r.total_received, 0)), 0) AS outstanding
         FROM customers c
         LEFT JOIN sales_voucher s
            ON s.customer_id = c.customer_id
            AND s.company_id = $1
            AND s.date BETWEEN $2 AND $3
         LEFT JOIN (
            SELECT sales_id, SUM(amount_paid) AS total_received
            FROM receipt_vouchers
            GROUP BY sales_id
         ) r ON r.sales_id = s.sales_id
         WHERE c.company_id = $1
         GROUP BY c.customer_id, c.name
         HAVING COUNT(s.sales_id) > 0
         ORDER BY total_sales DESC`,
        [company_id, date_from, date_to]
    );

    return res.status(200).json(
        new ApiResponse(200, {
            customers: result.rows
        }, "Customer-wise sales fetched successfully")
    );
});
export const salesProfitability = asyncHandler(async (req, res) => {

    const { company_id } = req.params;
    const { date_from, date_to } = req.query;

    const result = await pool.query(
        `SELECT
            i.item_id,
            i.item_name,
            SUM(svi.qty) AS total_quantity_sold,
            SUM(svi.total_amt) AS total_sales,
            SUM(svi.qty * i.default_purchase_price) AS estimated_cost,
            SUM(svi.total_amt) -
            SUM(svi.qty * i.default_purchase_price) AS estimated_gross_profit
         FROM sales_voucher_items svi
         JOIN sales_voucher s
            ON s.sales_id = svi.sales_id
         JOIN items i
            ON i.item_id = svi.item_id
         WHERE s.company_id = $1
         AND s.date BETWEEN $2 AND $3
         GROUP BY i.item_id, i.item_name
         ORDER BY estimated_gross_profit DESC`,
        [company_id, date_from, date_to]
    );

    return res.status(200).json(
        new ApiResponse(200, {
            profitability: result.rows,
            calculation: "Estimated using current default purchase price"
        }, "Profitability report fetched successfully")
    );
});