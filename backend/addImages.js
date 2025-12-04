// backend/addImages.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

// 🔸 Category-based and Brand-based image URLs
const imageMap = {
  // ---- Chocolate & Sweets ----
  chocolate: 'https://i.imgur.com/qEYYTgE.jpg',
  cadbury: 'https://i.imgur.com/JB9aCYH.jpg',
  dairy: 'https://i.imgur.com/VwYzvMd.jpg',
  nestle: 'https://i.imgur.com/KeBzjvg.jpg',
  ferrero: 'https://i.imgur.com/hmMIATv.jpg',
  // ---- Snacks & Chips ----
  chips: 'https://i.imgur.com/RqjP2UO.jpg',
  lays: 'https://i.imgur.com/RqjP2UO.jpg',
  kurkure: 'https://i.imgur.com/KUThuvr.jpg',
  bingo: 'https://i.imgur.com/fDw8RGZ.jpg',
  // ---- Beverages & Drinks ----
  drink: 'https://i.imgur.com/nZ2n0C6.jpg',
  beverage: 'https://i.imgur.com/nZ2n0C6.jpg',
  coke: 'https://i.imgur.com/BXghpIm.jpg',
  pepsi: 'https://i.imgur.com/qVb7v7f.jpg',
  frooti: 'https://i.imgur.com/O0KdpDb.jpg',
  // ---- Dairy & Butter ----
  amul: 'https://i.imgur.com/OTZV5P8.jpg',
  butter: 'https://i.imgur.com/mCkCzVe.jpg',
  milk: 'https://i.imgur.com/VwYzvMd.jpg',
  curd: 'https://i.imgur.com/QezpHHf.jpg',
  // ---- Sauces & Spreads ----
  sauce: 'https://i.imgur.com/M8bDe3I.jpg',
  ketchup: 'https://i.imgur.com/pXAz4kA.jpg',
  peanut: 'https://i.imgur.com/2T4AgYR.jpg',
  nutella: 'https://i.imgur.com/XbW1TXy.jpg',
  // ---- Breakfast & Cereals ----
  cereal: 'https://i.imgur.com/lmYzUPE.jpg',
  oats: 'https://i.imgur.com/hZQ3Olg.jpg',
  muesli: 'https://i.imgur.com/svD8wyK.jpg',
  // ---- Default ----
  default: 'https://i.imgur.com/lG6yHrk.jpg',
};

// 🔧 Function to find image by brand or category
const getImageForProduct = (brand, category) => {
  const brandKey = (brand || '').toLowerCase();
  const categoryKey = (category || '').toLowerCase();

  // Match by brand name first
  for (const key in imageMap) {
    if (brandKey.includes(key)) return imageMap[key];
  }

  // Then match by category
  for (const key in imageMap) {
    if (categoryKey.includes(key)) return imageMap[key];
  }

  // Fallback
  return imageMap.default;
};

const updateProductImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products.`);

    let updatedCount = 0;

    for (const product of products) {
      // Skip already updated ones
      if (product.imageUrl && !product.imageUrl.includes('placeholder')) continue;

      const newImageUrl = getImageForProduct(product.brand, product.category);

      await Product.updateOne(
        { _id: product._id },
        { $set: { imageUrl: newImageUrl } }
      );

      console.log(`🖼️ Updated: ${product.product_name} → ${newImageUrl}`);
      updatedCount++;
    }

    console.log(`\n🎉 All product images updated successfully! (${updatedCount} modified)`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

updateProductImages();
