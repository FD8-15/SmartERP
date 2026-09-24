const createUnit = asyncHandler(async (req, res) => {
    const { unit_name } = req.body;
    const { company_id } = req.params;

    if (!unit_name?.trim()) {
        throw new ApiError(400, "Unit name is required");
    }

    const result = await pool.query(
        `SELECT unit_id
         FROM units
         WHERE LOWER(TRIM(unit_name)) = LOWER(TRIM($1))`,
        [unit_name]
    );

    if (result.rows.length > 0) {
        throw new ApiError(409, "Unit already exists");
    }

    const result2 = await pool.query(
        `INSERT INTO units(unit_name)
         VALUES($1)
         RETURNING *`,
        [unit_name.trim()]
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
    const result = await pool.query(
        `SELECT *
         FROM units
         ORDER BY unit_name ASC`
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
    const { unit_id } = req.params;

    const result = await pool.query(
        `SELECT *
         FROM units
         WHERE unit_id=$1`,
        [unit_id]
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
    const { unit_id } = req.params;

    if (!unit_name?.trim()) {
        throw new ApiError(400, "Unit name is required");
    }

    const result = await pool.query(
        `SELECT unit_id
         FROM units
         WHERE LOWER(TRIM(unit_name)) = LOWER(TRIM($1))
         AND unit_id <> $2`,
        [unit_name, unit_id]
    );

    if (result.rows.length > 0) {
        throw new ApiError(409, "Unit already exists");
    }

    const result2 = await pool.query(
        `UPDATE units
         SET unit_name=$1
         WHERE unit_id=$2
         RETURNING *`,
        [unit_name.trim(), unit_id]
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