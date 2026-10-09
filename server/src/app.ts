import express, { type Application, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { getFilteredSwaggerDocument, resolveDocsAudience } from "./docs/swagger.js";
import { env } from "./env.config.js";
import v1Router from "./routes/v1/index.js";
import { notFoundHandler } from "./middlewares/notFound.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app: Application = express();

// Enable trust proxy for ngrok, reverse proxies, and load balancers
app.set("trust proxy", 1);

// Security HTTP headers (allow Swagger UI inline styles and scripts)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const allowedOrigins = [
  env.CLIENT_URL,
  "http://localhost:5175",
  "http://127.0.0.1:5175",
  "https://sdk.dev.myhubble.money",
  "https://dev.myhubble.money",
];

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin === "https://myhubble.money" ||
        origin.endsWith(".myhubble.money")
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Idempotency-Key",
      "idempotency-key",
      "X-Hubble-Secret",
      "x-hubble-secret",
      "X-HubbleSecret",
      "x-hubblesecret",
      "X-Verify",
      "x-verify",
      "X-Hubble-Signature",
      "x-hubble-signature",
      "X-TBX-Client-Id",
      "X-TBX-Client-Secret",
    ],
  })
);

// Body and Cookie parsers
app.use(cookieParser());
app.use(
  express.json({
    limit: "10mb",
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// System health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Interactive Swagger UI documentation (Audience derived from NODE_ENV)
const defaultAudience = resolveDocsAudience(env.NODE_ENV);
const activeSwaggerDoc = getFilteredSwaggerDocument(defaultAudience);

// Prevent browser from caching Swagger UI init specs across environment changes
app.use("/api-docs", (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  next();
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(activeSwaggerDoc, {
    customSiteTitle:
      defaultAudience === "student_production"
        ? "AP-Tech Banking & Card Platform API Documentation (Student View)"
        : "AP-Tech Banking & Card Platform API Documentation (Internal Full)",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  })
);

// Alias /docs to /api-docs
app.get("/docs", (_req: Request, res: Response) => {
  res.redirect("/api-docs");
});

// Raw OpenAPI JSON specification (for Postman Import & CI/CD)
app.get("/api-docs.json", (req: Request, res: Response) => {
  const audience = resolveDocsAudience(env.NODE_ENV, req.query.audience as string);
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(getFilteredSwaggerDocument(audience));
});

// Mount versioned API routes
app.use("/api/v1", v1Router);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

export default app;
