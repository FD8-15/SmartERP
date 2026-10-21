import { describe, it, expect, vi, beforeEach } from "vitest";
import pool from "../src/db/db.js";
import { getItems } from "../src/controllers/item.controller.js";

vi.mock("../src/db/db.js", () => ({
    default: {
        query: vi.fn()
    }
}));

describe("GET items pagination (mocked)", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    async function runGetItems(
        query = {},
        rows = [{ item_id: 3, company_id: 53, item_name: "Laptop" }]
    ) {
        pool.query.mockResolvedValueOnce({ rows });

        const req = {
            params: { company_id: "53" },
            query
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        await getItems(req, res, vi.fn());

        const body = res.json.mock.calls[0][0];
        const [sql, params] = pool.query.mock.calls[0];

        return { body, res, sql, params };
    }

    it("should calculate the correct offset for page 2", async () => {
        const { body, res, sql, params } = await runGetItems({
            page: "2",
            limit: "2"
        });

        expect(pool.query).toHaveBeenCalledOnce();

        expect(sql).toContain("limit $3 offset $4");
        expect(sql).toContain("order by item_id ASC");
        expect(params).toEqual(["53", null, 2, 2]);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(body.data.items).toHaveLength(1);
        expect(body.data.pagination).toEqual({
            page: 2,
            limit: 2
        });
    });

    it("should use the default pagination values", async () => {
        const { body, res, params } = await runGetItems({});

        expect(pool.query).toHaveBeenCalledOnce();
        expect(params).toEqual(["53", null, 10, 0]);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(body.data.pagination).toEqual({
            page: 1,
            limit: 10
        });
    });

    it("should enforce maximum pagination limit", async () => {
        const { body, params } = await runGetItems({
            page: "1",
            limit: "200"
        });

        expect(params).toEqual(["53", null, 100, 0]);
        expect(body.data.pagination).toEqual({
            page: 1,
            limit: 100
        });
    });

    it("should handle negative pagination values", async () => {
        const { body, params } = await runGetItems({
            page: "-3",
            limit: "-5"
        });

        expect(params).toEqual(["53", null, 1, 0]);
        expect(body.data.pagination).toEqual({
            page: 1,
            limit: 1
        });
    });

    it("should use defaults for invalid pagination values", async () => {
        const { body, params } = await runGetItems({
            page: "abc",
            limit: "xyz"
        });

        expect(params).toEqual(["53", null, 10, 0]);
        expect(body.data.pagination).toEqual({
            page: 1,
            limit: 10
        });
    });

    it("should combine search with pagination", async () => {
        const { body, params } = await runGetItems({
            search: "Laptop",
            page: "2",
            limit: "2"
        });

        expect(params).toEqual(["53", "%Laptop%", 2, 2]);
        expect(body.data.pagination).toEqual({
            page: 2,
            limit: 2
        });
    });

});
