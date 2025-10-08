"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.securityHeaders = exports.corsPreflightHandler = exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const corsOptions = {
    origin: [
        process.env.FRONTEND_URL || "https://manual-fits-frontend-x94h.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "https://manualfits.com",
        "https://www.manualfits.com",
        "https://manualfits.vercel.app",
        "https://manualfits-git-main-surya3209.vercel.app",
        "https://manualfits-git-develop-surya3209.vercel.app",
    ],
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
const corsPreflightHandler = (req, res, next) => {
    if (req.method === "OPTIONS") {
        console.log("CORS: Handling preflight request for:", req.path);
        console.log("CORS: Origin:", req.headers.origin);
        const origin = req.headers.origin;
        const allowedOrigins = [
            process.env.FRONTEND_URL || "https://manual-fits-frontend-x94h.vercel.app",
            "http://localhost:3000",
            "http://localhost:3001",
            "https://manualfits.com",
            "https://www.manualfits.com",
            "https://manualfits.vercel.app",
            "https://manualfits-git-main-surya3209.vercel.app",
            "https://manualfits-git-develop-surya3209.vercel.app",
        ];
        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader("Access-Control-Allow-Origin", origin);
            res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma,X-API-Key");
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Access-Control-Max-Age", "86400");
            console.log("CORS: ✅ Preflight headers set for origin:", origin);
            res.status(200).end();
            return;
        }
        else {
            console.log("CORS: ❌ Preflight blocked for origin:", origin);
        }
    }
    next();
};
exports.corsPreflightHandler = corsPreflightHandler;
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
