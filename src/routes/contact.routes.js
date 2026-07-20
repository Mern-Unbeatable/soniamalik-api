import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { asyncHandler } from "../middlewares/errorHandler.js";
import { validateZod } from "../middlewares/validateZod.js";
import { createContactSchema } from "../validators/contact.validation.js";
import * as contactController from "../controllers/contact.controller.js";

const router = Router();


router.post(
    "/",
    validateZod(createContactSchema),
    asyncHandler(contactController.createContact)
);

// Admin only routes
router.get(
    "/",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(contactController.getAllContacts)
);



router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    asyncHandler(contactController.deleteContact)
);

export default router;