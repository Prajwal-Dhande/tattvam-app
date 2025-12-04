// backend/middleware/authMiddleware.js

import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Middleware to verify the token and find the user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token, excluding the password
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// FIXED: Renamed this function from 'isAdmin' to 'admin'
// This middleware checks if the user from 'protect' is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // If user exists and is an admin, proceed
  } else {
    res.status(403); // Use 403 Forbidden for this specific case
    throw new Error('Not authorized as an admin');
  }
};

// FIXED: Changed to ES Module 'export' and exporting 'admin'
export { protect, admin };