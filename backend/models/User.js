// backend/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin'],
      default: 'user',
    },
    goals: {
      dailyCalories: { type: Number, default: 2000 },
      dailyProtein: { type: Number, default: 150 },
      dailyCarbs: { type: Number, default: 250 },
      dailyFat: { type: Number, default: 70 },
    },
    // --- NEW FIELDS FOR OTP VERIFICATION ---
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// --- PASSWORD MATCH FUNCTION ---
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// --- PASSWORD ENCRYPTION MIDDLEWARE ---
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);
export default User;