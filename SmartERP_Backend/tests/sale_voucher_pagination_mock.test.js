import { describe, it, expect, vi, beforeEach } from "vitest";
import pool from "../src/db/db.js";
import { getAllVouchers } from "../src/controllers/sale _voucher.controller.js";

vi.mock("../src/db/db.js", () => ({
    default: {
        query: vi.fn()
    }
}));

describe("GET sales vouchers pagination (mocked)", () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    async function runGetAllVouchers(query = {}, rows = [{ sales_id: 3, company_id: 53 }]) {
        pool.query.mockResolvedValueOnce({ rows });

        const req = {
            params: { company_id: "53" },
            query
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        await getAllVouchers(req, res, vi.fn());

        const body = res.json.mock.calls[0][0];
        const [sql, params] = pool.query.mock.calls[0];

        return { body, res, sql, params };
    }

    it("should calculate the correct offset for page 2", async () => {

        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    sales_id: 3,
                    company_id: 53,
                    customer_id: 12,
                    total_amt: "1000",
                    date: "2026-10-18"
                }
            ]
        });

        const req = {
            params: { company_id: "53" },
            query: { page: "2", limit: "2" }
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        await getAllVouchers(req, res, vi.fn());

        const body = res.json.mock.calls[0][0];

        expect(pool.query).toHaveBeenCalledOnce();

        const [sql, params] = pool.query.mock.calls[0];

        expect(sql).toContain("LIMIT $3 OFFSET $4");
        expect(sql).toContain("ORDER BY sales_id ASC");
        expect(params).toEqual(["53", null, 2, 2]);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(body.data.Vouchers).toHaveLength(1);
        expect(body.data.pagination).toEqual({
            page: 2,
            limit: 2
        });
    });
    it("should use the default pagination values", async () => {

        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    sales_id: 3,
                    company_id: 53,
                    customer_id: 12,
                    total_amt: "1000",
                    date: "2026-10-18"
                }
            ]
        });

        const req = {
            params: { company_id: "53" },
            query: {}
        };

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        await getAllVouchers(req, res, vi.fn());

        const body = res.json.mock.calls[0][0];

        expect(pool.query).toHaveBeenCalledOnce();

        const [sql, params] = pool.query.mock.calls[0];

        expect(sql).toContain("LIMIT $3 OFFSET $4");
        expect(sql).toContain("ORDER BY sales_id ASC");
        expect(params).toEqual(["53", null, 10, 0]);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(body.data.Vouchers).toHaveLength(1);
        expect(body.data.pagination).toEqual({
            page: 1,
            limit: 10
        });
    });
    it("should enforce maximum pagination limit", async () => {
        const { body, params } = await runGetAllVouchers({
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
        const { body, params } = await runGetAllVouchers({
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
        const { body, params } = await runGetAllVouchers({
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
        const { body, params } = await runGetAllVouchers({
            search: "12",
            page: "2",
            limit: "2"
        });

        expect(params).toEqual(["53", "%12%", 2, 2]);
        expect(body.data.pagination).toEqual({
            page: 2,
            limit: 2
        });
    });
});