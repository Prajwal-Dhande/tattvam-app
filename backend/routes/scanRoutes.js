import express from "express";
import { createScan, getMyScans } from "../controllers/scanController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===============================
// SAVE A NEW SCAN 
// POST /api/scans
// ===============================
router.post("/", protect, createScan);

// ===============================
// GET USER'S SCAN HISTORY
// GET /api/scans/my
// ===============================
router.get("/my", protect, getMyScans);

export default router;
