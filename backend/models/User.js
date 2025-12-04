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
    // --- ROLE FIELD ---
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // --- DAILY GOALS ---
    goals: {
      dailyCalories: { type: Number, default: 2000 },
      dailyProtein: { type: Number, default: 150 },
      dailyCarbs: { type: Number, default: 250 },
      dailyFat: { type: Number, default: 70 },
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

// --- CREATE MODEL ---
const User = mongoose.model('User', userSchema);

// --- EXPORT DEFAULT (for ES Modules) ---
export default User;
