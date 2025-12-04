// --- Ingredient Database ---
const INGREDIENT_DATABASE = {
    'sugar': { safety: 'unhealthy', warning: 'High in added sugar.' },
    'refined wheat flour (maida)': { safety: 'unhealthy', warning: 'Refined grain, lacks fiber and nutrients.' },
    'refined palm oil': { safety: 'unhealthy', warning: 'High in saturated fat.' },
    'palm oil': { safety: 'unhealthy', warning: 'High in saturated fat.' },
    'invert sugar syrup': { safety: 'unhealthy', warning: 'A form of added sugar.' },
    'high fructose corn syrup': { safety: 'unhealthy', warning: 'High in added sugar.' },
    'hydrogenated oil': { safety: 'unhealthy', warning: 'Contains trans fats.' },
    'monosodium glutamate': { safety: 'unhealthy', warning: 'MSG can cause reactions in sensitive individuals.' },
    'msg': { safety: 'unhealthy', warning: 'MSG can cause reactions in sensitive individuals.' },
    'iodised salt': { safety: 'moderate', warning: 'High sodium content can be a concern.' },
    'salt': { safety: 'moderate', warning: 'High sodium content can be a concern.' },
    'caffeine': { safety: 'moderate', warning: 'Stimulant, not recommended for children.' },
    'artificial flavouring substances': { safety: 'moderate', warning: 'Contains artificial flavors.' },
    'sweeteners (955, 950)': { safety: 'moderate', warning: 'Contains artificial sweeteners.'}
};

function analyzeIngredients(ingredients) {
    if (!Array.isArray(ingredients)) return { ingredients: [], warnings: [] };
    const warnings = new Set();
    const analyzedIngredients = ingredients.map(ing => {
        if (!ing || typeof ing.name !== 'string') return { name: 'Invalid Ingredient Data', safety: 'neutral' };
        const lowerCaseName = ing.name.toLowerCase();
        let bestMatch = null;
        for (const key in INGREDIENT_DATABASE) {
            if (lowerCaseName.includes(key)) {
                bestMatch = INGREDIENT_DATABASE[key];
                break;
            }
        }
        if (bestMatch) {
            if (bestMatch.warning) warnings.add(bestMatch.warning);
            return { name: ing.name, safety: bestMatch.safety };
        }
        return { name: ing.name, safety: 'neutral' };
    });
    return { ingredients: analyzedIngredients, warnings: Array.from(warnings) };
}

// --- FINAL FIX: Separate, Stricter Logic for Beverages ---
function calculateBeverageScore(nutrition) {
    if (!nutrition) return 'D';
    const sugar = nutrition.sugar || 0; // Sugar per 100ml

    if (sugar > 9) return 'E';   // e.g., Sting, Coca-Cola
    if (sugar > 6) return 'D';   // e.g., Most fruit juices
    if (sugar > 2.5) return 'C'; // e.g., Lightly sweetened drinks
    if (sugar > 0) return 'B';    // e.g., Flavored water with a hint of sugar
    return 'A'; // Only pure water
}

// --- FINAL FIX: "No-Excuses" Scoring for Foods ---
// Positive nutrients (protein/fiber) CANNOT rescue an unhealthy product.
function calculateFoodScore(nutrition) {
    if (!nutrition) return 'D';
    let penaltyPoints = 0;

    // Penalize based on "per 100g" values
    const calories = nutrition.calories || 0;
    if (calories > 475) penaltyPoints += 4;
    else if (calories > 350) penaltyPoints += 2;

    const sugar = nutrition.sugar || 0;
    if (sugar > 25) penaltyPoints += 4;
    else if (sugar > 15) penaltyPoints += 2;

    const fat = nutrition.fat || 0;
    if (fat > 20) penaltyPoints += 3;
    else if (fat > 10) penaltyPoints += 1;

    // Sodium is critical and gets a heavy penalty (values in mg)
    const sodium = nutrition.sodium || 0;
    if (sodium > 1200) penaltyPoints += 5; // Very high (Maggi)
    else if (sodium > 600) penaltyPoints += 3;

    // Grade is based SOLELY on penalty points
    if (penaltyPoints >= 9) return 'E'; // e.g., Maggi (4+1+5 = 10 points)
    if (penaltyPoints >= 6) return 'D'; // e.g., Parle-G (2+4 = 6 points)
    if (penaltyPoints >= 3) return 'C';
    if (penaltyPoints >= 1) return 'B';
    return 'A';
}

function calculateStarRating(nutriScore) {
    const scoreMap = { 'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0 };
    return scoreMap[nutriScore] || 1.0;
}

// --- FINAL FIX: Main function now directs traffic ---
export function performHealthAnalysis(productData) {
    const { ingredients, nutrition } = productData;
    const ingredientAnalysis = analyzeIngredients(ingredients);
    
    let nutriScore;
    // Check if the product is a beverage (low calories but potentially high sugar)
    const isBeverage = (nutrition?.calories < 80 && ingredients?.[0]?.name?.toLowerCase().includes('water'));

    if (isBeverage) {
        nutriScore = calculateBeverageScore(nutrition);
    } else {
        nutriScore = calculateFoodScore(nutrition);
    }

    const rating = calculateStarRating(nutriScore);

    return {
        ...productData,
        ingredients: ingredientAnalysis.ingredients,
        warnings: ingredientAnalysis.warnings,
        nutriScore: nutriScore,
        rating: rating
    };
}