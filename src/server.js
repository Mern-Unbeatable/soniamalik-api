import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config/index.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { startEventStatusCron, stopEventStatusCron } from "./jobs/eventStatusCron.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://soniamalikfrontend.maktechgroup.tech",
  "https://soniamalik14.maktechgroup.tech"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

// Handle preflight requests
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// HTTP request logger - use 'dev' for simple logs, 'combined' for detailed logs, or 'tiny' for minimal
app.use(morgan(config.nodeEnv === "development" ? "dev" : "dev"));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Routes
app.use("/api", routes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ESSAHUB (SoniaMalik) Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      events: "/api/events",
      products: "/api/products",
      services: "/api/services",
      orders: "/api/orders",
      threads: "/api/threads",
      recruitments: "/api/recruitments",
      clubs: "/api/clubs",
      news: "/api/news",
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to database
    const connected = await connectDatabase();
    if (!connected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    // Start event status cron after DB is ready.
    startEventStatusCron();

    // Start server
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      console.log(`Database: Connected`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  stopEventStatusCron();
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  stopEventStatusCron();
  await disconnectDatabase();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled Rejection:", error);
  process.exit(1);
});

startServer();

export default app;
