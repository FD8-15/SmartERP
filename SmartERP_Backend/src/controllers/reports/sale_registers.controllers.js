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