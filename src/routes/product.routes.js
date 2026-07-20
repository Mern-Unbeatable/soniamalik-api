import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Get all products - TODO: Implement" });
  }),
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Get product by ID - TODO: Implement" });
  }),
);

router.post(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Create product - TODO: Implement" });
  }),
);

router.put(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Update product - TODO: Implement" });
  }),
);

router.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ success: true, message: "Delete product - TODO: Implement" });
  }),
);

export default router;
