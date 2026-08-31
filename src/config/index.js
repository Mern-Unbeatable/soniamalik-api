import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(projectRoot, ".env") });

export const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  backendUrl:
    process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET || "your-default-secret-change-this",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",


  adminEmail: process.env.ADMIN_EMAIL || "admin@essahub.co.uk",
  // Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  uploadPath: process.env.UPLOAD_PATH || "./uploads",


  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error(`Expected .env file at: ${path.join(projectRoot, ".env")}`);
    process.exit(1);
  }
});
