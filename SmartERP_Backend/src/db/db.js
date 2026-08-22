import { Pool } from "pg";

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "rajnaik",
    database: "smarterp_db",
})
export const connectDB = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query("SELECT NOW()");
        console.log(" PostgreSQL Connected");
        console.log("Database Time:", result.rows[0].now);
        client.release();
    } catch (err) {
        console.error(" Database Connection Failed");
        console.error(err.message);
        process.exit(1);
    }
};

export default pool;