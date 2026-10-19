import { Router } from "express";
import { recordBrandClick } from "../controllers/marketplace.controller.js";

const router = Router();

router.post("/brand-clicks", recordBrandClick);

export default router;
