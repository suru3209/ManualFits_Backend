"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.securityHeaders = exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://localhost:3000",
            "http://localhost:3001",
            "https://manualfits.com",
            "https://www.manualfits.com",
            "https://manualfits.vercel.app",
            "https://manualfits-git-main-surya3209.vercel.app",
            "https://manualfits-git-develop-surya3209.vercel.app",
        ];
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`CORS: Blocked request from origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
        "Cache-Control",
        "Pragma",
        "X-API-Key",
    ],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400,
};
exports.corsMiddleware = (0, cors_1.default)(corsOptions);
const securityHeaders = (req, res, next) => {
    res.removeHeader("X-Powered-By");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-RateLimit-Limit", "1000");
    res.setHeader("X-RateLimit-Remaining", "999");
    res.setHeader("X-RateLimit-Reset", new Date(Date.now() + 3600000).toISOString());
    next();
};
exports.securityHeaders = securityHeaders;
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const logMessage = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`;
        if (res.statusCode >= 400) {
            console.error(`❌ ${logMessage}`);
        }
        else {
            console.log(`✅ ${logMessage}`);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
