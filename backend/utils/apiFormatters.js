export const formatOpenFoodFactsData = (apiData) => {
    if (!apiData || !apiData.product) {
        console.error("❌ No product data in API response");
        return null;
    }

    const p = apiData.product;

    // ✅ 1. DATA SANITIZATION: Clean and round off decimals
    const nutrition = {
        calories: Math.round(Number(p.nutriments?.["energy-kcal_100g"]) || 0),
        protein: Number((Number(p.nutriments?.proteins_100g) || 0).toFixed(1)),
        carbs: Number((Number(p.nutriments?.carbohydrates_100g) || 0).toFixed(1)),
        fat: Number((Number(p.nutriments?.fat_100g) || 0).toFixed(1)),
        sugar: Number((Number(p.nutriments?.sugars_100g) || 0).toFixed(1)),
        sodium: p.nutriments?.sodium_100g ? Math.round(p.nutriments.sodium_100g * 1000) : 0
    };

    // ✅ 2. EXTRACT API GRADE
    let rawGrade = p.nutriscore_grade || p.nutrition_grade_fr || p.nutrition_grades || "?";
    let nutriScore = String(rawGrade).trim().toUpperCase();

    const validGrades = ['A', 'B', 'C', 'D', 'E'];

    // ✅ 3. SMART FALLBACK: Custom logic ONLY if API fails to provide a valid grade
    if (!validGrades.includes(nutriScore)) {
        if (nutrition.sugar > 15 || nutrition.fat > 25) nutriScore = 'E'; // Extreme junk fallback
        else if (nutrition.fat > 15 || nutrition.sodium > 500) nutriScore = 'D'; 
        else if (nutrition.sugar > 5 || nutrition.fat > 10) nutriScore = 'C';
        else nutriScore = '?';
    }

    // ✅ 4. RATING MAPPING: Based on the final Nutri-Score
    const ratingMap = { A: 5, B: 4, C: 3, D: 2, E: 1, '?': 3 };
    const rating = ratingMap[nutriScore] || 3;

    // ✅ 5. INGREDIENTS FORMATTING: Clean up strings and garbage URLs
    const ingredientsText = p.ingredients_text_en || p.ingredients_text || "";
    const ingredients = ingredientsText
        .split(",")
        .map(i => i.trim())
        .filter(text => text.length >= 2 && text.length <= 40 && !text.toLowerCase().includes("www."))
        .map(text => ({ name: text, safety: "neutral" }));

    // ✅ 6. AUTO WARNINGS GENERATOR
    const warnings = [];
    if (nutrition.sugar > 10) warnings.push("High in Sugar");
    if (nutrition.fat > 20) warnings.push("High in Fat");
    if (nutrition.sodium > 400) warnings.push("High in Sodium");

    return {
        barcode: p.code,
        name: p.product_name || "Unknown",
        brand: p.brands || "Unknown",
        imageUrl: p.image_url || p.image_front_url || "",
        nutriScore,
        rating,
        ingredients,
        nutrition,
        warnings,
        status: "approved"
    };
};