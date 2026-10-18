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

        let resolveResponse;

        const responsePromise = new Promise(resolve => {
            resolveResponse = resolve;
        });

        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(body => {
                resolveResponse(body);
                return res;
            })
        };

        await getAllVouchers(req, res, vi.fn());

        const body = await responsePromise;

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

});