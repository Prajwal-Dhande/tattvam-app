// backend/models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      trim: true,
    },

    // MAIN IDENTIFIER
    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,   // ❗ REMOVED index:true (duplicate)
    },

    // BASIC PRODUCT INFO
    product_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Accept both `product_brand` and `brand` from seeder
    product_brand: {
      type: String,
      trim: true,
      default: "Unknown",
    },

    category: {
      type: String,
      trim: true,
      default: "General",
    },

    // INGREDIENTS (string, will be parsed later)
    ingredients: {
      type: String,
      trim: true,
      default: "Not specified",
    },

    // NUTRITION VALUES
    sugar_content_g: { type: Number, default: 0 },
    fat_content_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
    protein_content_g: { type: Number, default: 0 },
    carbs_content_g: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },

    // ADDITIVES
    preservatives: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    artificial_colors: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },

    // HEALTH RATING
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },

    remarks: {
      type: String,
      trim: true,
      default: "No remarks available",
    },

    // IMAGE URL
    image_url: {
      type: String,
      trim: true,
      default: "/uploads/placeholder.png",
    },

    // Submitted by user
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
    },
  },
  { timestamps: true }
);

// FIXED INDEXES
productSchema.index({ barcode: 1 });          // keep ONLY this
productSchema.index({ product_name: "text" });

const Product = mongoose.model("Product", productSchema);
export default Product;
