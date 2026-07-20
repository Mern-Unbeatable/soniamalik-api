import { Prisma } from "@prisma/client";
/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // Prisma unique constraint
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      error: err.meta?.target,
    });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  // Prisma validation error (IMPORTANT)
  if (err instanceof Prisma.PrismaClientValidationError) {
    // Check if it's an enum validation error
    if (err.message.includes("Expected ServiceStatus")) {
      // Try to extract the invalid value from the error message
      const match = err.message.match(/status: "([^"]+)"/);
      const invalidValue = match ? match[1] : "unknown";

      return res.status(400).json({
        success: false,
        message: `Invalid status value: "${invalidValue}". Please use a valid service status.`,
        error: "Invalid enum value provided",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid data provided. Please check submitted fields.",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }

  // Prisma known request errors (fallback)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      success: false,
      message: "Database request failed.",
    });
  }

  // Custom validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Custom app errors
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      details: err,
    }),
  });
};


export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};


export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

