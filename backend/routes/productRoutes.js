import express from 'express';
const router = express.Router();
import {
  getProducts, 
  getProductByBarcode,
  createProduct,
  getPendingProducts,
  rejectProduct,
  updateProduct,
  getTrendingProducts,
  searchProducts,
  getHealthyAlternatives,
  askProductAI, 
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../config/multerConfig.js';

// --- Main User Routes ---
router.get('/', getProducts);
router.get('/trending', getTrendingProducts);
router.get('/search', searchProducts);
router.get('/alternatives', getHealthyAlternatives);
router.get('/:barcode', getProductByBarcode);
router.post('/', protect, upload.single('image'), createProduct);

// --- Admin Specific Routes ---
router.get('/admin/pending', protect, admin, getPendingProducts);
router.delete('/admin/:id/reject', protect, admin, rejectProduct);
router.put('/:id', protect, admin, updateProduct);

// --- AI Chat Route ---
router.post('/:barcode/ask', askProductAI);

export default router;