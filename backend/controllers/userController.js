// backend/controllers/userController.js

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import nodemailer from 'nodemailer';

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

  // --- NODEMAILER SETUP (Moved inside the function to get .env values properly) ---
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  // --- SEND EMAIL ---
  const mailOptions = {
    from: `"Tattvam AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Tattvam Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
        <h2>Welcome to Tattvam! 🍃</h2>
        <p>Hi ${name}, your verification code is:</p>
        <h1 style="color: #00C897; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });

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

export { authUser, registerUser, verifyOtp, getUserProfile };