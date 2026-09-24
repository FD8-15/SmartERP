import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createUnit = asyncHandler(async (req, res) => {
    const { unit_name } = req.body;
    const { company_id } = req.params;

    if (!unit_name?.trim()) {
        throw new ApiError(400, "Unit name is required");
    }

    const unitName = unit_name.trim();

    const result = await pool.query(
        `SELECT unit_id
         FROM units
         WHERE company_id = $1
         AND LOWER(TRIM(unit_name)) = LOWER(TRIM($2))`,
        [company_id, unitName]
    );

    if (result.rows.length > 0) {
        throw new ApiError(409, "Unit already exists");
    }

    const result2 = await pool.query(
        `INSERT INTO units(company_id, unit_name)
         VALUES($1, $2)
         RETURNING *`,
        [company_id, unitName]
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                result2.rows[0],
                "Unit created successfully"
            )
        );
});

const getUnits = asyncHandler(async (req, res) => {
    const { company_id } = req.params;

    const result = await pool.query(
        `SELECT *
         FROM units
         WHERE company_id = $1
         ORDER BY unit_name ASC`,
        [company_id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "No units found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result.rows,
                "Units fetched successfully"
            )
        );
});

const getOneUnit = asyncHandler(async (req, res) => {
    const { company_id, unit_id } = req.params;

    const result = await pool.query(
        `SELECT *
         FROM units
         WHERE unit_id = $1
         AND company_id = $2`,
        [unit_id, company_id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Unit not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result.rows[0],
                "Unit fetched successfully"
            )
        );
});

const updateUnit = asyncHandler(async (req, res) => {
    const { unit_name } = req.body;
    const { company_id, unit_id } = req.params;

    if (!unit_name?.trim()) {
        throw new ApiError(400, "Unit name is required");
    }

    const unitName = unit_name.trim();

    const result = await pool.query(
        `SELECT unit_id
         FROM units
         WHERE company_id = $1
         AND LOWER(TRIM(unit_name)) = LOWER(TRIM($2))
         AND unit_id <> $3`,
        [company_id, unitName, unit_id]
    );

    if (result.rows.length > 0) {
        throw new ApiError(409, "Unit already exists");
    }

    const result2 = await pool.query(
        `UPDATE units
         SET unit_name = $1
         WHERE company_id = $2
         AND unit_id = $3
         RETURNING *`,
        [unitName, company_id, unit_id]
    );

    if (result2.rows.length === 0) {
        throw new ApiError(404, "Unit not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result2.rows[0],
                "Unit updated successfully"
            )
        );
});

export {
    createUnit,
    getUnits,
    getOneUnit,
    updateUnit
};