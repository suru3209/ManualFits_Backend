import cors from "cors";
import { Request, Response, NextFunction } from "express";

// CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log("CORS: Allowing request with no origin");
      return callback(null, true);
    }

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

    console.log(`CORS: Checking origin: ${origin}`);
    console.log(`CORS: Allowed origins:`, allowedOrigins);
    console.log(`CORS: FRONTEND_URL env var:`, process.env.FRONTEND_URL);

    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: ✅ Allowing request from origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS: ❌ Blocked request from origin: ${origin}`);
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

// Additional CORS handling for preflight requests
export const corsPreflightHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    console.log("CORS: Handling preflight request for:", req.path);
    console.log("CORS: Origin:", req.headers.origin);
    console.log("CORS: Request method:", req.headers["access-control-request-method"]);
    console.log("CORS: Request headers:", req.headers["access-control-request-headers"]);
    
    // Set CORS headers manually for preflight
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
    } else {
      console.log("CORS: ❌ Preflight blocked for origin:", origin);
    }
    
    res.status(200).end();
    return;
  }
  next();
};

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
