import pool from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createCategory = asyncHandler(async (req, res) => {
    const { category_name } = req.body;
    const { company_id } = req.params;

    if (!category_name?.trim()) {
        throw new ApiError(400, "Category name is required");
    }

    const categoryName = category_name.trim();

    const result = await pool.query(
        `SELECT category_id
         FROM categories
         WHERE company_id = $1
         AND LOWER(TRIM(category_name)) = LOWER(TRIM($2))`,
        [company_id, categoryName]
    );

    if (result.rows.length > 0) {
        throw new ApiError(409, "Category already exists");
    }

    const result2 = await pool.query(
        `INSERT INTO categories(company_id, category_name)
         VALUES($1, $2)
         RETURNING *`,
        [company_id, categoryName]
    );

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                result2.rows[0],
                "Category created successfully"
            )
        );
});

const getCategories = asyncHandler(async (req, res) => {
    const { company_id } = req.params;

    const result = await pool.query(
        `SELECT *
         FROM categories
         WHERE company_id = $1
         ORDER BY category_name ASC`,
        [company_id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "No categories found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result.rows,
                "Categories fetched successfully"
            )
        );
});

const getOneCategory = asyncHandler(async (req, res) => {
    const { company_id, category_id } = req.params;

    const result = await pool.query(
        `SELECT *
         FROM categories
         WHERE category_id = $1
         AND company_id = $2`,
        [category_id, company_id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result.rows[0],
                "Category fetched successfully"
            )
        );
});

const updateCategory = asyncHandler(async (req, res) => {
    const { category_name } = req.body;
    const { company_id, category_id } = req.params;

    if (!category_name?.trim()) {
        throw new ApiError(400, "Category name is required");
    }

    const categoryName = category_name.trim();

    const result = await pool.query(
        `SELECT category_id
         FROM categories
         WHERE company_id = $1
         AND LOWER(TRIM(category_name)) = LOWER(TRIM($2))
         AND category_id <> $3`,
        [company_id, categoryName, category_id]
    );

    if (result.rows.length > 0) {
        throw new ApiError(409, "Category already exists");
    }

    const result2 = await pool.query(
        `UPDATE categories
         SET category_name = $1
         WHERE company_id = $2
         AND category_id = $3
         RETURNING *`,
        [categoryName, company_id, category_id]
    );

    if (result2.rows.length === 0) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result2.rows[0],
                "Category updated successfully"
            )
        );
});

const deleteCategory = asyncHandler(async (req, res) => {
    const { company_id, category_id } = req.params;

    const result = await pool.query(
        `DELETE FROM categories
         WHERE company_id = $1
         AND category_id = $2
         RETURNING *`,
        [company_id, category_id]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Category not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                result.rows[0],
                "Category deleted successfully"
            )
        );
});

export {
    createCategory,
    getCategories,
    getOneCategory,
    updateCategory,
    deleteCategory
};