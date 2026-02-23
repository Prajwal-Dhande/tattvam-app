import asyncHandler from 'express-async-handler';
import Scan from '../models/Scan.js';

// @desc    Record a new scan (Save to History)
// @route   POST /api/scans
// @access  Private
const createScan = asyncHandler(async (req, res) => {
    // Frontend sends the product details, we just save it to history
    const { barcode, product } = req.body;

    if (!barcode || !product) {
        return res.status(400).json({ message: 'Barcode and product data are required' });
    }

    const scan = await Scan.create({
        user: req.user._id,
        barcode: barcode,
        // Handle different naming conventions (frontend vs backend)
        productName: product.name || product.product_name || "Unknown Product",
        productImage: product.imageUrl || product.image_url || "",
        nutriScore: product.nutriScore || "?",
        scannedAt: Date.now()
    });

    res.status(201).json(scan);
});

// @desc    Get logged in user's scan history
// @route   GET /api/scans/my
// @access  Private
const getMyScans = asyncHandler(async (req, res) => {
    const scans = await Scan.find({ user: req.user._id })
        .sort({ scannedAt: -1 }) // Newest first
        .limit(50); // Limit to last 50 scans

    res.json(scans);
});

export {
    createScan,
    getMyScans
};