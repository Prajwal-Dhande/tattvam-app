import asyncHandler from 'express-async-handler';
import Scan from '../models/Scan.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// CREATE SCAN
const createScan = asyncHandler(async (req, res) => {
  // 1. Strict Auth Check
  if (!req.user || !req.user._id) {
    logger.error("Scan failed: User missing in request");
    return res.status(401).json({ message: "Not authorized" });
  }

  const { barcode, product } = req.body;
  const finalBarcode = barcode || product?.barcode;

  if (!finalBarcode) {
    return res.status(400).json({ message: "Barcode is required" });
  }

  try {
    // 2. Map Data correctly
    const scanData = {
      user: new mongoose.Types.ObjectId(req.user._id), // Explicit cast
      barcode: finalBarcode,
      scannedAt: new Date(),
      productName: product?.name || product?.product_name || "Unknown",
      productBrand: product?.brand || product?.product_brand || "Brand",
      productImage: product?.imageUrl || product?.image_url || "",
      nutriScore: product?.nutriScore || "?",
      rating: Number(product?.rating) || 0,
      // Ensure arrays/objects are safe
      ingredients: Array.isArray(product?.ingredients) ? product.ingredients : [],
      nutrition: product?.nutrition || {},
      warnings: Array.isArray(product?.warnings) ? product.warnings : []
    };

    const createdScan = await Scan.create(scanData);
    logger.info(`Scan saved for ${finalBarcode} by user ${req.user._id}`);
    
    res.status(201).json(createdScan);

  } catch (error) {
    logger.error(`Scan save error: ${error.message}`);
    // Don't crash the app, just return error
    res.status(500).json({ message: "Failed to save scan history" });
  }
});

// GET HISTORY
const getMyScans = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Not authorized" });
  }
  const scans = await Scan.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(scans);
});

export { createScan, getMyScans };