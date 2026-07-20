import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { validateZod } from "../middlewares/validateZod.js";
import {
    createInterestRequestSchema,
    updateRequestStatusSchema
} from "../validators/interestRequest.validation.js";
import * as interestRequestController from "../controllers/interestRequest.controller.js";

const router = Router();

router.post(
    "/",
    authenticate,
    validateZod(createInterestRequestSchema),
    authorize("USER"),
    asyncHandler(interestRequestController.createInterestRequest)
);

router.get(
    "/my",
    authenticate,
    authorize("USER"),
    asyncHandler(interestRequestController.getUserInterestRequests)
);

router.get(
    "/:id",
    authenticate,
    asyncHandler(interestRequestController.getInterestRequestById)
);


router.delete(
    "/:id",
    authenticate,
    asyncHandler(interestRequestController.deleteInterestRequest)
);


router.get(
    "/admin/all",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(interestRequestController.getAllInterestRequests)
);

router.patch(
    "/:id/status",
    authenticate,
    authorize("ADMIN"),
    validateZod(updateRequestStatusSchema),
    asyncHandler(interestRequestController.updateRequestStatus)
);

export default router;