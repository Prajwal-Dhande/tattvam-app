// backend/utils/apiFormatters.js

// --- FORMATTER 1: OPEN FOOD FACTS ---
export const formatOpenFoodFactsData = (apiData) => {
    if (!apiData || !apiData.product) return null;
    const p = apiData.product;
    
    let rating = 3;
    let warnings = [];
    if (p.nutriscore_grade) {
        const grade = p.nutriscore_grade.toLowerCase();
        if (grade === 'a') rating = 5;
        else if (grade === 'b') rating = 4;
        else if (grade === 'c') rating = 3;
        else if (grade === 'd') rating = 2;
        else if (grade === 'e') rating = 1;
    }

    if ((p.nutriments?.sugars_100g || 0) > 22.5) warnings.push("High in sugar.");
    if ((p.nutriments?.fat_100g || 0) > 17.5) warnings.push("High in fat.");
    if ((p.nutriments?.salt_100g || 0) > 1.5) warnings.push("High in salt.");

    const safety = rating <= 2 ? "high-risk" : rating < 4 ? "moderate" : "safe";

    return {
        barcode: p.code,
        name: p.product_name || 'Unknown',
        brand: p.brands || 'Unknown',
        imageUrl: p.image_url || p.image_front_url || "",
        nutriScore: p.nutriscore_grade || "?",
        rating,
        safety,
        ingredients: (p.ingredients_text_en || "").split(",").map(i => ({ name: i.trim(), safety: "neutral" })),
        nutrition: {
            calories: p.nutriments?.['energy-kcal_100g'] || 0,
            protein: p.nutriments?.proteins_100g || 0,
            carbs: p.nutriments?.carbohydrates_100g || 0,
            fat: p.nutriments?.fat_100g || 0,
            sugar: p.nutriments?.sugars_100g || 0,
            sodium: p.nutriments?.sodium_100g ? p.nutriments.sodium_100g * 1000 : 0,
        },
        warnings
    };
};

// --- FORMATTER 2: SPOONACULAR ---
export const formatSpoonacularData = (apiData, barcode) => {
    if (!apiData) return null;
    const p = apiData;
    const nutrition = p.nutrition?.nutrients || [];
    const findNutrient = (name) => nutrition.find(n => n.name === name)?.amount || 0;
    
    // Simple heuristic for rating if not provided
    let rating = p.spoonacularScore ? (p.spoonacularScore / 20).toFixed(1) : 3;
    
    return {
        barcode: barcode,
        name: p.title || 'Unknown',
        brand: p.brand || 'Unknown',
        imageUrl: p.image || (p.images && p.images.length > 0 ? p.images[0] : ""),
        nutriScore: "?",
        rating: Number(rating),
        ingredients: (p.ingredientList || "").split(",").map(i => ({ name: i.trim(), safety: "neutral" })),
        nutrition: {
            calories: findNutrient('Calories'),
            protein: findNutrient('Protein'),
            carbs: findNutrient('Carbohydrates'),
            fat: findNutrient('Fat'),
            sugar: findNutrient('Sugar'),
            sodium: findNutrient('Sodium'),
        },
        warnings: []
    };
};

// --- FORMATTER 3: USDA ---
export const formatUsdaData = (apiData, barcode) => {
    if (!apiData) return null;
    const p = apiData;
    const findNutrient = (nutrientId) => p.foodNutrients.find(n => n.nutrientId === nutrientId)?.value || 0;
    
    const fat = findNutrient(1004); 
    const sugar = findNutrient(2000); // Sugars, total including NLEA
    let rating = 5;
    let warnings = [];
    
    if (fat > 17.5) { rating -= 1; warnings.push("High in fat."); }
    if (sugar > 22.5) { rating -= 1; warnings.push("High in sugar."); }
    
    return {
        barcode: barcode || p.fdcId.toString(),
        name: p.description,
        brand: p.brandOwner || 'Generic',
        imageUrl: "", // USDA rarely has images
        nutriScore: "?",
        rating: Math.max(1, rating),
        ingredients: (p.ingredients || "").toLowerCase().split(",").map(i => ({ name: i.trim(), safety: "neutral" })),
        nutrition: {
            calories: findNutrient(1008), 
            protein: findNutrient(1003), 
            carbs: findNutrient(1005), 
            fat: fat,
            sugar: sugar,
            sodium: findNutrient(1093)
        },
        warnings: warnings
    };
};