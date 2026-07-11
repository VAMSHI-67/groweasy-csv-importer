import { Router } from "express";
import { extractController } from "../controllers/extract.controller";

const router = Router();

/**
 * POST /api/csv/extract
 *
 * Accepts raw CSV rows + headers, runs AI extraction,
 * and returns structured CRM records.
 */
router.post("/extract", extractController);

export default router;
