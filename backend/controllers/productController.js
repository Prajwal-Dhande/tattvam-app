import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/Product.js";
import fetch from "node-fetch";
import { formatOpenFoodFactsData } from "../utils/apiFormatters.js";

/* ======================================================================
   MAP DB → FRONTEND FORMAT (PERFECT MATCH FOR REACT NATIVE)
   ====================================================================== */
const mapProductForFrontend = (p) => {
  const badKeywords = ["palm oil", "msg", "sugar", "salt", "preservative", "artificial", "refined wheat flour"];
  const ingList = p.ingredients ? p.ingredients.split(",").map((i) => i.trim()) : [];
  const badIngList = ingList.filter(ing => 
    badKeywords.some(bad => ing.toLowerCase().includes(bad))
  );

  let finalNutriScore = p.nutriScore;
  if (!finalNutriScore || finalNutriScore === "?") {
      const sugar = p.sugar_content_g || 0;
      const fat = p.fat_content_g || 0;
      const sodium = p.sodium_mg || 0;

      if (sugar > 15 || fat > 25) finalNutriScore = 'E';
      else if (fat > 15 || sodium > 500) finalNutriScore = 'D';
      else if (sugar > 5 || fat > 10) finalNutriScore = 'C';
      else finalNutriScore = 'B'; 
  }

  const ratingMap = { A: 5, B: 4, C: 3, D: 2, E: 1 };
  let finalRating = p.rating || 3.5;
  if (!p.nutriScore || p.nutriScore === "?") {
      finalRating = ratingMap[finalNutriScore] || finalRating;
  }

  return {
    barcode: p.barcode,
    name: p.product_name,
    brand: p.product_brand,
    imageUrl: p.image_url,
    ingredients: ingList, 
    badIngredients: badIngList, 
    nutrition: {
      calories: Math.round(p.calories || 0),
      protein: Number((p.protein_content_g || 0).toFixed(1)),
      carbs: Number((p.carbs_content_g || 0).toFixed(1)),
      fat: Number((p.fat_content_g || 0).toFixed(1)),
      sugar: Number((p.sugar_content_g || 0).toFixed(1)),
      sodium: Math.round(p.sodium_mg || 0),
    },
    rating: finalRating,
    nutriScore: finalNutriScore, 
    warnings: p.remarks ? p.remarks.split("; ").filter(Boolean) : [],
    status: p.status || "approved",
  };
};

/* ======================================================================
   🤖 AI FALLBACK FUNCTION (For Missing Nutri-Score)
   ====================================================================== */
const getAIProductDetails = async (ingredientsText, nutritionData, productName) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
        
        const prompt = `
        You are an expert Dietitian. I have a product named "${productName}". 
        Its raw ingredients are: ${ingredientsText}.
        Its nutrition info is: ${JSON.stringify(nutritionData)}.
        
        Task:
        1. Clean up the ingredients list (remove numbers, weird brackets like ") 4").
        2. Identify 'badIngredients' (like Sugar, Palm Oil, Preservatives).
        3. Estimate a realistic Nutri-Score (A, B, C, D, or E) based on these ingredients and nutrition.
        
        Respond STRICTLY in this JSON format only:
        {
          "nutriScore": "D",
          "cleanIngredients": ["Ingredient 1", "Ingredient 2"],
          "badIngredients": ["Palm Oil", "Sugar"]
        }`;

        const result = await model.generateContent(prompt);
        let aiText = result.response.text();
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(aiText);
    } catch (error) {
        console.error("AI Fallback Error:", error);
        return null; // Silent fail agar API me kuch issue ho
    }
};

// ============================================================================
// BARCODE SCANNER LOGIC
// ============================================================================

const getProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎯 CONTROLLER START - Barcode:", barcode);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const existing = await Product.findOne({ barcode });
  
  if (existing && existing.nutriScore !== '?') {
    console.log("✅ FOUND IN DB WITH VALID SCORE");
    return res.json(mapProductForFrontend(existing));
  }
  
  if (existing && existing.nutriScore === '?') {
    console.log("⚠️ DB MEIN KACHRA SCORE ('?') THA, FETCHING FRESH DATA...");
  }

  console.log("📡 FETCHING FROM API...");
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
  );
  const json = await response.json();

  if (!json || !json.product) {
    console.log("❌ NOT FOUND IN API");
    return res.status(404).json({ message: "Product not found" });
  }

  console.log("🔄 FORMATTING DATA...");
  const finalData = formatOpenFoodFactsData(json);

  if (!finalData) {
    return res.status(500).json({ message: "Failed to process product data" });
  }

  // ✅ NAYA LOGIC: AI FALLBACK INJECTION
  if (!finalData.nutriScore || finalData.nutriScore === '?' || finalData.nutriScore === 'unknown') {
      console.log("🤖 API didn't give Nutri-Score. Calling Gemini AI Fallback...");
      
      const rawIngredients = Array.isArray(finalData.ingredients) ? finalData.ingredients.join(', ') : (finalData.ingredients || "");
      const aiData = await getAIProductDetails(rawIngredients, finalData.nutrition, finalData.name);
      
      if (aiData) {
          finalData.nutriScore = aiData.nutriScore.toUpperCase();
          finalData.ingredients = aiData.cleanIngredients;
      } else {
          finalData.nutriScore = 'E'; // Default if AI fails
      }
      console.log("✨ AI Generated Score:", finalData.nutriScore);
  }

  const nutriScoreToSave = finalData.nutriScore ? String(finalData.nutriScore).toUpperCase() : "?";
  
  try {
     const saved = await Product.findOneAndUpdate(
        { barcode: finalData.barcode },
        {
          barcode: finalData.barcode,
          product_name: finalData.name,
          product_brand: finalData.brand,
          image_url: finalData.imageUrl,
          ingredients: Array.isArray(finalData.ingredients) 
            ? finalData.ingredients.map(i => i.name || i).join(", ") 
            : finalData.ingredients,
          calories: Math.round(finalData.nutrition?.calories || 0),
          protein_content_g: Number((finalData.nutrition?.protein || 0).toFixed(1)),
          carbs_content_g: Number((finalData.nutrition?.carbs || 0).toFixed(1)),
          fat_content_g: Number((finalData.nutrition?.fat || 0).toFixed(1)),
          sugar_content_g: Number((finalData.nutrition?.sugar || 0).toFixed(1)),
          sodium_mg: Math.round(finalData.nutrition?.sodium || 0),
          rating: finalData.rating || 3.5,
          nutriScore: nutriScoreToSave, 
          remarks: Array.isArray(finalData.warnings) ? finalData.warnings.join("; ") : "",
          status: "approved",
        },
        { new: true, upsert: true, runValidators: true }
      );
      console.log("✅ SAVED TO DB:", saved.barcode, "WITH SCORE:", nutriScoreToSave);
  } catch (err) {
      console.error("❌ DB SAVE ERROR:", err);
  }

  const badKeywords = ["palm oil", "msg", "sugar", "salt", "preservative", "artificial"];
  const ingArray = Array.isArray(finalData.ingredients) 
    ? finalData.ingredients.map(i => i.name || i) 
    : (finalData.ingredients ? finalData.ingredients.split(",") : []);
    
  finalData.ingredients = ingArray;
  finalData.badIngredients = ingArray.filter(ing => 
    badKeywords.some(bad => String(ing).toLowerCase().includes(bad))
  );

  console.log("📤 SENDING TO FRONTEND!");
  return res.json(finalData);
});

/* ======================================================================
   OTHER CONTROLLERS
   ====================================================================== */

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "approved" }).sort({ createdAt: -1 }).limit(10);
  res.json(products.map(mapProductForFrontend));
});

const getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "approved" })
    .sort({ updatedAt: -1 })
    .limit(5);
  res.json(products.map(mapProductForFrontend));
});

const getPendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ status: "pending" });
  res.json(products.map(mapProductForFrontend));
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, brand, barcode } = req.body;
  if (!name || !barcode) return res.status(400).json({ message: "Name & barcode required" });

  const exists = await Product.findOne({ barcode });
  if (exists) return res.status(400).json({ message: "Product already exists" });

  const product = await Product.create({
    product_name: name,
    product_brand: brand || "Unknown",
    barcode,
    status: "pending",
  });
  res.status(201).json(mapProductForFrontend(product));
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  product.product_name = req.body.name || product.product_name;
  product.product_brand = req.body.brand || product.product_brand;
  product.status = req.body.status || product.status;

  const updated = await product.save();
  res.json(mapProductForFrontend(updated));
});

const rejectProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  await product.deleteOne();
  res.json({ message: "Product removed" });
});

const searchProducts = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? { product_name: { $regex: req.query.keyword, $options: "i" } } 
    : {};

  const products = await Product.find({ ...keyword }).limit(10);
  res.json(products.map(mapProductForFrontend));
});

const getHealthyAlternatives = asyncHandler(async (req, res) => {
  const alternatives = await Product.find({
    nutriScore: { $in: ['A', 'B'] },
    status: "approved"
  }).limit(4);

  res.json(alternatives.map(mapProductForFrontend));
});

const askProductAI = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const { question } = req.body;

  if (!question) return res.status(400).json({ message: "Bhai, question toh bhej!" });

  const product = await Product.findOne({ barcode });
  if (!product) return res.status(404).json({ message: "Product not found" });

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a strict, highly knowledgeable health and nutrition expert named 'Tattvam AI'. 
    The user is asking a question about the following product:
    
    Name: ${product.product_name}
    Brand: ${product.product_brand}
    Ingredients: ${product.ingredients}
    Nutritional Info (per 100g): Calories: ${product.calories}, Sugar: ${product.sugar_content_g}g, Fat: ${product.fat_content_g}g, Sodium: ${product.sodium_mg}mg.
    Nutri-Score Grade: ${product.nutriScore} (A is best, E is worst).

    User's Question: "${question}"

    Please provide a short, clear, and highly scientific answer (max 3-4 sentences). Be honest if the product is unhealthy. Do not use complex markdown formatting like ** or *, keep it plain readable text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ answer: text });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI thoda busy hai, baad mein try karo." });
  }
});

export {
  getProducts,
  getProductByBarcode,
  getTrendingProducts,
  getPendingProducts,
  createProduct,
  updateProduct,
  rejectProduct,
  searchProducts,
  getHealthyAlternatives,
  askProductAI,
};