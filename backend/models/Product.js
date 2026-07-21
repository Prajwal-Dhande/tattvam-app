import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // --- ID & BASIC INFO ---
    product_id: { type: String, trim: true },
    
    barcode: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true 
    },

    product_name: { 
      type: String, 
      required: true, 
      trim: true 
    },

    product_brand: { 
      type: String, 
      trim: true, 
      default: "Unknown" 
    },

    category: { 
      type: String, 
      trim: true, 
      default: "General" 
    },

    // --- INGREDIENTS ---
    ingredients: { 
      type: String, 
      trim: true, 
      default: "Not specified" 
    },

    // --- NUTRITION VALUES (Numbers only) ---
    sugar_content_g: { type: Number, default: 0 },
    fat_content_g: { type: Number, default: 0 },
    sodium_mg: { type: Number, default: 0 },
    protein_content_g: { type: Number, default: 0 },
    carbs_content_g: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },

    // --- ADDITIVES ---
    preservatives: { type: String, enum: ["Yes", "No"], default: "No" },
    artificial_colors: { type: String, enum: ["Yes", "No"], default: "No" },

    // ✅ NUTRISCORE - AGGRESSIVE UPPERCASE ENFORCEMENT
    nutriScore: { 
      type: String, 
      trim: true,
      uppercase: true,  // Schema-level enforcement
      default: "?",
      // Custom setter that ALWAYS uppercases
      set: function(value) {
        const processed = String(value || "?").trim().toUpperCase();
        console.log(`🔧 SCHEMA SETTER: "${value}" → "${processed}"`);
        return processed;
      },
      // Custom getter that ALWAYS uppercases (extra safety)
      get: function(value) {
        const processed = String(value || "?").toUpperCase();
        return processed;
      }
    },

    // --- RATING & REMARKS ---
    rating: { type: Number, min: 1, max: 5, default: 3 },
    
    remarks: { 
      type: String, 
      trim: true, 
      default: "" 
    },

    // --- METADATA ---
    image_url: { type: String, trim: true, default: "/uploads/placeholder.png" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["approved", "pending", "rejected"], default: "approved" },
  },
  { 
    timestamps: true,
    toJSON: { getters: true },  // ✅ Enable getters in JSON output
    toObject: { getters: true } // ✅ Enable getters in object output
  }
);

// ✅ LOGGING MIDDLEWARE FOR DEBUGGING
productSchema.pre('save', function(next) {
  console.log("🔧 PRE-SAVE nutriScore:", this.nutriScore);
  next();
});

productSchema.post('save', function(doc) {
  console.log("✅ POST-SAVE nutriScore:", doc.nutriScore);
});

productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const nutriScore = update.$set?.nutriScore || update.nutriScore;
  console.log("🔧 PRE-UPDATE nutriScore:", nutriScore);
  next();
});

// Indexes for fast searching

productSchema.index({ product_name: "text" });

const Product = mongoose.model("Product", productSchema);

// ✅ THIS LINE IS CRITICAL - DO NOT REMOVE!
export default Product;