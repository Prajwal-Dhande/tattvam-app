// backend/seeder.js

import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import Product from "./models/Product.js";

dotenv.config();

// TEMP: Debugging - confirm your env is loading correctly
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI not found in .env");
  process.exit(1);
}

// Load products.json
let products = [];

try {
  products = JSON.parse(fs.readFileSync("./products.json", "utf-8"));
  console.log("📦 Loaded products.json successfully");
} catch (err) {
  console.error("❌ ERROR: Could not read products.json");
  console.error(err.message);
  process.exit(1);
}

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err);
    process.exit(1);
  });

async function seedData() {
  console.log("⏳ Seeding products into database...");

  for (const item of products) {
    try {
      const exists = await Product.findOne({ barcode: item.barcode });

      if (exists) {
        console.log(`⚠️ Skipped (already exists): ${item.product_name}`);
        continue;
      }

      await Product.create(item);
      console.log(`✔ Inserted: ${item.product_name}`);

    } catch (err) {
      console.error(`❌ Failed to insert: ${item.product_name}`);
      console.error(err.message);
    }
  }

  console.log("🎉 Seeding complete!");
  process.exit();
}

seedData();
