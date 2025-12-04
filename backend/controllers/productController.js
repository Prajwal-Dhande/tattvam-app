import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import fetch from 'node-fetch';
import { performHealthAnalysis } from '../utils/healthAnalysisService.js';
import { formatOpenFoodFactsData, formatUsdaData, formatSpoonacularData } from '../utils/apiFormatters.js';
import logger from '../utils/logger.js';

/* -------------------------------------------------------
   HELPER: Map DB Product -> Frontend Format
   (Converts snake_case DB fields to camelCase UI fields)
------------------------------------------------------- */
const mapProductForFrontend = (p) => ({
  barcode: p.barcode,
  name: p.product_name || "Unknown",
  brand: p.product_brand || "Unknown",
  category: p.category || "General",
  
  // Handle missing or placeholder images
  imageUrl: p.image_url && p.image_url !== 'null' && p.image_url !== '' 
    ? p.image_url 
    : "/uploads/placeholder.png",

  // Handle ingredients (String -> Array of Objects)
  ingredients: p.ingredients 
    ? (typeof p.ingredients === "string" 
        ? p.ingredients.split(",").map(i => ({ name: i.trim(), safety: "neutral" })) 
        : p.ingredients)
    : [],

  nutrition: {
    calories: p.calories || 0,
    protein: p.protein_content_g || 0,
    carbs: p.carbs_content_g || 0,
    fat: p.fat_content_g || 0,
    sugar: p.sugar_content_g || 0,
    sodium: p.sodium_mg || 0,
  },

  rating: p.rating || 3,
  nutriScore: p.nutriScore || "E",
  warnings: p.remarks ? p.remarks.split(";").map(w => w.trim()) : [],
  status: p.status,
});

/* -------------------------------------------------------
   HELPER: Smart Search for "Best Match"
   (Searches OFF by name to find a high-quality record/image)
------------------------------------------------------- */
const findBestMatch = async (brand, name) => {
  try {
    const query = `${brand} ${name}`;
    // Search OFF for the most popular results matching this name
    const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=1`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.products && data.products.length > 0) {
      return data.products[0];
    }
  } catch (error) {
    logger.warn(`Smart search failed for ${brand} ${name}: ${error.message}`);
  }
  return null;
};

/* -------------------------------------------------------
   GET PRODUCT BY BARCODE (Waterfall & Smart-Fill)
------------------------------------------------------- */
const getProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  logger.info(`Searching for barcode: ${barcode}`);

  // 1. LOCAL DB CHECK
  let product = await Product.findOne({ barcode });

  if (product) {
    logger.info(`FOUND product in local DB: ${product.product_name}`);
    const mapped = mapProductForFrontend(product);
    // Re-analyze just in case rules changed
    const analyzed = performHealthAnalysis(mapped);
    return res.json(analyzed);
  }

  let finalProductData = null;

  // 2. OPEN FOOD FACTS (Primary Source)
  try {
    const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const offData = await offRes.json();
    
    if (offData.status === 1 || offData.product) {
      logger.info(`Found in OpenFoodFacts`);
      finalProductData = formatOpenFoodFactsData(offData);
    }
  } catch (e) {
    logger.warn(`OFF Failed: ${e.message}`);
  }

  // 3. USDA FALLBACK (If OFF failed)
  // (Only runs if USDA_API_KEY is in .env)
  if (!finalProductData && process.env.USDA_API_KEY) {
    try {
      const usdaRes = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${barcode}&api_key=${process.env.USDA_API_KEY}`);
      const usdaData = await usdaRes.json();
      
      if (usdaData.foods && usdaData.foods.length > 0) {
        logger.info(`Found in USDA`);
        finalProductData = formatUsdaData(usdaData.foods[0], barcode);
      }
    } catch (e) {
      logger.warn(`USDA Failed: ${e.message}`);
    }
  }

  // 4. SPOONACULAR FALLBACK (If others failed)
  // (Only runs if SPOONACULAR_API_KEY is in .env)
  if (!finalProductData && process.env.SPOONACULAR_API_KEY) {
    try {
      const spoonRes = await fetch(`https://api.spoonacular.com/food/products/upc/${barcode}?apiKey=${process.env.SPOONACULAR_API_KEY}`);
      if (spoonRes.ok) {
        const spoonData = await spoonRes.json();
        logger.info(`Found in Spoonacular`);
        finalProductData = formatSpoonacularData(spoonData, barcode);
      }
    } catch (e) {
      logger.warn(`Spoonacular Failed: ${e.message}`);
    }
  }

  // 5. SMART FILL & SAVE
  if (finalProductData) {
    // VALIDATION: Don't try to smart-fill if we don't even have a valid name
    const hasValidName = finalProductData.name && 
                         finalProductData.name.toLowerCase() !== 'unknown' &&
                         finalProductData.name.trim() !== '';

    // Check for missing image or incomplete data
    const isMissingImage = !finalProductData.imageUrl || 
                           finalProductData.imageUrl.includes('placeholder') || 
                           finalProductData.imageUrl === "";
                           
    const isMissingNutrition = finalProductData.nutrition.calories === 0;

    // Only run Smart Fill if we have a real name to search for
    if (hasValidName && (isMissingImage || isMissingNutrition)) {
        logger.info(`Product data sparse for "${finalProductData.name}". Attempting Smart Fill...`);
        const bestMatch = await findBestMatch(finalProductData.brand, finalProductData.name);
        
        if (bestMatch) {
            // Fill Image
            if (isMissingImage && (bestMatch.image_url || bestMatch.image_front_url)) {
                let newImg = bestMatch.image_url || bestMatch.image_front_url;
                if (newImg.startsWith('http://')) newImg = newImg.replace('http://', 'https://');
                finalProductData.imageUrl = newImg;
                logger.info(`✅ Smart Fill: Found better image`);
            }
            
            // OPTIONAL: Fill Ingredients/Nutrition if ours is empty but match has it
            if (isMissingNutrition && bestMatch.nutriments) {
                 // You can add logic here to merge nutrition data if needed
            }
        }
    } else if (!hasValidName) {
        logger.warn("Skipping Smart Fill: Product name is Unknown.");
    }

    // Save to Local DB (Persistence)
    try {
        const newProduct = await Product.create({
            barcode: finalProductData.barcode,
            product_name: finalProductData.name,
            product_brand: finalProductData.brand,
            image_url: finalProductData.imageUrl,
            
            // Convert Array of Objects back to String for DB storage
            ingredients: Array.isArray(finalProductData.ingredients) 
                ? finalProductData.ingredients.map(i => i.name).join(", ")
                : finalProductData.ingredients,
            
            calories: finalProductData.nutrition.calories,
            protein_content_g: finalProductData.nutrition.protein,
            carbs_content_g: finalProductData.nutrition.carbs,
            fat_content_g: finalProductData.nutrition.fat,
            sugar_content_g: finalProductData.nutrition.sugar,
            sodium_mg: finalProductData.nutrition.sodium,
            
            rating: finalProductData.rating,
            nutriScore: finalProductData.nutriScore,
            remarks: finalProductData.warnings.join("; "),
            status: "approved"
        });
        logger.info(`Saved new product to DB: ${newProduct.product_name}`);
    } catch (saveError) {
        // Ignore duplicate key errors (parallel requests), log others
        if (!saveError.message.includes('E11000')) {
            logger.error(`Failed to save product to DB: ${saveError.message}`);
        }
    }

    return res.json(finalProductData);
  }

  // 6. NOT FOUND ANYWHERE
  logger.warn(`NOT FOUND: ${barcode}`);
  return res.status(404).json({
    message: "Product not found. Please add it manually.",
  });
});

/* -------------------------------------------------------
   CREATE PRODUCT (USER SUBMITTED)
------------------------------------------------------- */
const createProduct = asyncHandler(async (req, res) => {
  const { name, brand, barcode } = req.body;

  if (!name || !brand || !barcode) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const exists = await Product.findOne({ barcode });
  if (exists) {
    return res.status(400).json({ message: "Product already exists" });
  }

  const imagePath = req.file
    ? "/" + req.file.path.replace(/\\/g, "/")
    : "/uploads/placeholder.png";

  const newProduct = await Product.create({
    product_name: name,
    product_brand: brand,
    barcode,
    image_url: imagePath,
    submittedBy: req.user?._id || null,
    status: "pending",
  });

  res.status(201).json(newProduct);
});

/* -------------------------------------------------------
   TRENDING PRODUCTS
------------------------------------------------------- */
const getTrendingProducts = asyncHandler(async (req, res) => {
  logger.info("Trending products requested");

  const products = await Product.find({ status: "approved" }).limit(4);

  // Use the mapper to ensure frontend gets correct camelCase format
  return res.json(products.map(mapProductForFrontend));
});

/* -------------------------------------------------------
   ADMIN: UPDATE PRODUCT
------------------------------------------------------- */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json({ message: "Product not found" });

  product.product_name = req.body.name || product.product_name;
  product.product_brand = req.body.brand || product.product_brand;
  product.ingredients = req.body.ingredients || product.ingredients;
  product.calories = req.body.calories || product.calories;
  // Add other fields as necessary for admin updates

  // Re-run analysis on update
  const mapped = mapProductForFrontend(product);
  const analyzed = performHealthAnalysis(mapped);

  product.nutriScore = analyzed.nutriScore;
  product.rating = analyzed.rating;
  product.remarks = analyzed.warnings.join("; ");

  const updated = await product.save();

  res.json(updated);
});

/* -------------------------------------------------------
   ADMIN: PENDING PRODUCTS
------------------------------------------------------- */
const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "pending" });
  res.json(products);
});

/* -------------------------------------------------------
   ADMIN: REJECT PRODUCT
------------------------------------------------------- */
const rejectProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) return res.status(404).json({ message: "Product not found" });

  await product.deleteOne();

  res.json({ message: "Product deleted" });
});

/* -------------------------------------------------------
   EXPORT
------------------------------------------------------- */
export {
  getProductByBarcode,
  createProduct,
  getTrendingProducts,
  updateProduct,
  getPendingProducts,
  rejectProduct,
};