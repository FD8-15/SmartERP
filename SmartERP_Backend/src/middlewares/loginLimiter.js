import { rateLimit } from "express-rate-limit";

const loginLimiter = rateLimit({
    // configuration goes here
    windowMs: 60 * 1000,
    limit: 5,
    message: "Too many login attempts",
    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res, next, options) => {
        return res.status(429).json({
            statusCode: 429,
            message: "Too many login attempts. Please try again later.",
            success: false
        });
    }
});
export { loginLimiter };