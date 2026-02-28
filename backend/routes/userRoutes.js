// backend/routes/userRoutes.js

import express from 'express';
const router = express.Router();
import {
  authUser,
  registerUser,
  verifyOtp, // Naya function import kiya
  getUserProfile,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

// --- Public routes ---
router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp); // Naya route OTP verification ke liye
router.post('/login', authUser);
router.post('/admin/login', authUser);

// --- Private route ---
router.route('/profile').get(protect, getUserProfile);

export default router;