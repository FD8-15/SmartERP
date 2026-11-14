import pool from "../../db/db";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";

const sales = asyncHandler(async (req, res) => {

    const { company_id } = req.params
    const { date_from, date_to } = req.query
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const result = await pool.query("select s.* from sale_vouchers s  where s.date between $1 and $2 and s.company_id=$3 order by s.date ASC limit $4 and offset $5", [date_from, date_to, company_id, limit.offset])

    const totalResult = await pool.query("SELECT COUNT(*) FROM sale_vouchers WHERE company_id = $1 AND date BETWEEN $2 AND $3", [company_id, date_from, date_to]
    );
    const totalRecords = Number(totalResult.rows[0].count);
})