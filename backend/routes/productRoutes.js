import express from 'express';
const router = express.Router();
import {
  getProductByBarcode,
  createProduct,
  getPendingProducts,
  rejectProduct,
  updateProduct,
  getTrendingProducts, // 1. Imported the new controller function
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../config/multerConfig.js';

// --- Main User Routes ---

// 2. Added the new route for fetching trending products
router.get('/trending', protect, getTrendingProducts);

router.get('/:barcode', protect, getProductByBarcode);
router.post('/', protect, upload.single('image'), createProduct);


// --- Admin Specific Routes ---
router.get('/admin/pending', protect, admin, getPendingProducts);
router.delete('/admin/:id/reject', protect, admin, rejectProduct);

// --- Route for Updating and Approving Products (Admin) ---
router.put('/:id', protect, admin, updateProduct);

export default router;