// backend/routes/userRoutes.js

import express from 'express';
const router = express.Router();
import {
  authUser,
  registerUser,
  verifyOtp, // Naya function import kiya
  getUserProfile,
  forgotPassword,
  resetPassword,
  googleLogin,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

// --- Public routes ---
router.post('/register', registerUser);
router.post('/verify-otp', verifyOtp); // Naya route OTP verification ke liye
router.post('/login', authUser);
router.post('/admin/login', authUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google-login', googleLogin);

// --- Private route ---
router.route('/profile').get(protect, getUserProfile);

export default router;