import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { uploadServiceImages } from "../middlewares/upload.js";
import * as draftController from "../controllers/draft.controller.js";

const router = Router();

router.use(authenticate, authorize("COACH", "PROVIDER", "ADMIN"));

router.get("/", draftController.listDrafts);
router.post("/", uploadServiceImages("drafts"), draftController.createDraft);
router.put("/:id", uploadServiceImages("drafts"), draftController.updateDraft);
router.delete("/:id", draftController.deleteDraft);

export default router;
