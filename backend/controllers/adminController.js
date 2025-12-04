// backend/controllers/adminController.js

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Product from '../models/Product.js';
import generateToken from '../utils/generateToken.js';

// =============================================
// AUTHENTICATION
// =============================================

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && user.role === 'admin' && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// =============================================
// PRODUCT MANAGEMENT (ADMIN)
// =============================================

// @desc    Get all products with "pending" status
// @route   GET /api/admin/products/pending
// @access  Private/Admin
const getPendingProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ status: 'pending' }).populate('submittedBy', 'name email');
    res.json(products);
});

// @desc    Approve a product by ID
// @route   PUT /api/admin/products/approve/:id
// @access  Private/Admin
const approveProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        product.name = req.body.name || product.name;
        product.brand = req.body.brand || product.brand;
        product.imageUrl = req.body.imageUrl || product.imageUrl;
        product.ingredients = req.body.ingredients || product.ingredients;
        product.nutrition = req.body.nutrition || product.nutrition;
        product.rating = req.body.rating || product.rating;
        product.nutriScore = req.body.nutriScore || product.nutriScore;
        product.warnings = req.body.warnings || product.warnings;
        product.status = 'approved';

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// @desc    Reject (delete) a product by ID
// @route   DELETE /api/admin/products/reject/:id
// @access  Private/Admin
const rejectProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (product) {
        await product.deleteOne();
        res.json({ message: 'Product removed' });
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// =============================================
// USER MANAGEMENT (ADMIN)
// =============================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
});

// @desc    Update a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.role = req.body.role || user.role;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'admin') {
            res.status(400);
            throw new Error('Cannot delete an admin user');
        }
        await user.deleteOne();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// --- EXPORT ALL CONTROLLER FUNCTIONS ---
export {
    loginAdmin,
    getPendingProducts,
    approveProduct,
    rejectProduct,
    getAllUsers,
    updateUserRole,
    deleteUser,
};
