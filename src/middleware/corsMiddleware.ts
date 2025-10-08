import cors from "cors";
import { Request, Response, NextFunction } from "express";

// CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL ||
        "https://manual-fits-frontend-x94h.vercel.app",
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
    } else {
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
  maxAge: 86400, // 24 hours
};

export const corsMiddleware = cors(corsOptions);

// Security headers middleware
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Remove X-Powered-By header
  res.removeHeader("X-Powered-By");

  // Set security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Rate limiting headers (basic)
  res.setHeader("X-RateLimit-Limit", "1000");
  res.setHeader("X-RateLimit-Remaining", "999");
  res.setHeader(
    "X-RateLimit-Reset",
    new Date(Date.now() + 3600000).toISOString()
  );

  next();
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logMessage = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`;

    if (res.statusCode >= 400) {
      console.error(`❌ ${logMessage}`);
    } else {
      console.log(`✅ ${logMessage}`);
    }
  });

  next();
};
