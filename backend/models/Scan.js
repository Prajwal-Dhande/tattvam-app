import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Optional link to Product DB (not required for your app)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },

    barcode: {
      type: String,
      required: true,
    },

    // ---- SNAPSHOT FIELDS FOR HISTORY ----
    productName: {
      type: String,
      default: 'Unknown',
    },

    productBrand: {
      type: String,
      default: 'Brand',
    },

    productImage: {
      type: String,
      default: '',
    },

    nutriScore: {
      type: String,
      default: '?',
    },

    rating: {
      type: Number,
      default: 0,
    },

    // Should ALWAYS be an array
    ingredients: {
      type: Array,
      default: [],
    },

    // Store nutrition as an object
    nutrition: {
      type: Object,
      default: {},
    },

    warnings: {
      type: [String],
      default: [],
    },

    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Scan = mongoose.model('Scan', scanSchema);
export default Scan;
