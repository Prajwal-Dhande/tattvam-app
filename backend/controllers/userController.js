// backend/controllers/userController.js

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
// nodemailer hata diya, ab hum sidha Google Apps Script use kar rahe hain!

// @desc    Auth user & get token (Login)
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Check if verified
    if (!user.isVerified) {
      res.status(401);
      throw new Error('Please verify your email via OTP first.');
    }

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

// @desc    Register a new user (Generates OTP)
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  let user = await User.findOne({ email });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  if (user) {
    if (user.isVerified) {
      res.status(400);
      throw new Error('User already exists and is verified.');
    } else {
      // If user exists but not verified, update their OTP and resend
      user.name = name;
      user.password = password; 
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }
  } else {
    // Create new unverified user
    user = await User.create({
      name,
      email,
      password,
      otp,
      otpExpires,
      isVerified: false
    });
  }

  // ✅ THE BRAHMASTRA: HTTP Request via Google Apps Script (Bypassing Render SMTP Block)
  const scriptUrl = "https://script.google.com/macros/s/AKfycbwpvMNf5Qu25K1h3pN13bxN96qpJJY7fYY3xaAaF14jdcNQXWdsn6mwTd9Lw2g73i0TRw/exec"; 

  const emailData = {
    to: email,
    subject: 'Your Tattvam Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to Tattvam! 🍃</h2>
        <p>Hi ${name}, your verification code is:</p>
        <h1 style="color: #00C897; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `
  };

  try {
    // Google ke server ko sidha order de rahe hain mail bhejne ka
    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(emailData),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Email sent via Google Apps Script (Bypassed Render!)');
  } catch (error) {
    console.log('❌ Error sending email:', error);
  }

  res.status(201).json({ message: 'OTP has been sent to your email.' });
});

// @desc    Verify OTP and log user in
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if OTP matches and is not expired
  if (user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  // Success! Verify user and clear OTP fields
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Send back token to auto-login the user
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Initiate forgot password (Send OTP)
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate 6-digit OTP for password reset
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send OTP via Google Apps Script
  const scriptUrl = "https://script.google.com/macros/s/AKfycbwpvMNf5Qu25K1h3pN13bxN96qpJJY7fYY3xaAaF14jdcNQXWdsn6mwTd9Lw2g73i0TRw/exec"; 

  const emailData = {
    to: email,
    subject: 'Tattvam - Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Password Reset Request 🔐</h2>
        <p>Hi ${user.name}, your code to reset your password is:</p>
        <h1 style="color: #00C897; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(emailData),
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Forgot Password Email sent via Google Apps Script');
  } catch (error) {
    console.log('❌ Error sending forgot password email:', error);
  }

  res.status(200).json({ message: 'Password reset OTP has been sent to your email.' });
});

// @desc    Reset password using OTP
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otp !== otp || user.otpExpires < Date.now()) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  // Update password and clear OTP
  user.password = newPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password has been reset successfully.' });
});

// @desc    Google Login / Registration
// @route   POST /api/users/google-login
// @access  Public
const googleLogin = asyncHandler(async (req, res) => {
  const { email, name, googleId } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    // If user exists (either normal or Google), log them in. 
    // They are verified automatically if they sign in via Google.
    user.isVerified = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    // Create new user, a random secure password is required for schema
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    user = await User.create({
      name,
      email,
      password: randomPassword,
      isVerified: true // Automatically verified
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  }
});

export { authUser, registerUser, verifyOtp, getUserProfile, forgotPassword, resetPassword, googleLogin };