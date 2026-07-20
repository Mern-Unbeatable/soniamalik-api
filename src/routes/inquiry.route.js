import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import * as inquiryController from "../controllers/inquery.controller.js";

const router = Router();
router.use(authenticate);
router.get(
  "/",
  authorize("PROVIDER", "COACH", "ADMIN"),
  asyncHandler(inquiryController.getAllInquiries)
);


router.get(
  "/:type/:inquiryId",
  authorize("PROVIDER", "COACH", "ADMIN"),
  asyncHandler(inquiryController.getInquiryById)
);



export default router;