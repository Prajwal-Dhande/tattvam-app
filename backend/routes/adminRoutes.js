// backend/routes/adminRoutes.js

import express from 'express';
const router = express.Router();
import {
    loginAdmin,
    getPendingProducts,
    approveProduct,
    rejectProduct,
    getAllUsers,
    updateUserRole,
    deleteUser,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// Public route for admin login
router.post('/login', loginAdmin);

// Product management routes (protected and for admins only)
router.get('/products/pending', protect, admin, getPendingProducts);
router.put('/products/approve/:id', protect, admin, approveProduct);
router.delete('/products/reject/:id', protect, admin, rejectProduct);

// User management routes (protected and for admins only)
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:userId/role', protect, admin, updateUserRole);
router.delete('/users/:userId', protect, admin, deleteUser);

export default router;