/**
 * Recipe Researcher - Finds and extracts recipe information
 * Uses web_search to find recipes and extract structured data
 */

/**
 * Parse ingredients from recipe text
 * @param {string} text - Recipe text containing ingredients
 * @returns {Array} List of ingredients with quantities
 */
function parseIngredients(text) {
  const ingredients = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for lines that look like ingredients (e.g., "2 cups flour", "1 egg")
    if (/^\d+/.test(trimmed) && trimmed.length > 3 && trimmed.length < 200) {
      ingredients.push(trimmed);
    }
  }

  return ingredients.length > 0 ? ingredients : ['Ingredients not available'];
}

/**
 * Parse instructions from recipe text
 * @param {string} text - Recipe text containing instructions
 * @returns {Array} List of instruction steps
 */
function parseInstructions(text) {
  const instructions = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for instruction-like lines (numbered or with action verbs)
    if (/^\d+\./.test(trimmed) || /^(mix|add|cook|bake|fry|boil|sauté|chop|stir|combine|whisk|blend)/i.test(trimmed)) {
      instructions.push(trimmed);
    }
  }

  return instructions.length > 0 ? instructions : ['Instructions not available'];
}

/**
 * Estimate nutrition based on meal type and calories
 * @param {string} mealType - 'breakfast', 'snack', or 'dinner'
 * @param {number} targetCalories - Target calorie count
 * @returns {Object} Estimated nutrition info
 */
function estimateNutrition(mealType, targetCalories) {
  const ratios = {
    breakfast: { protein: 0.15, carbs: 0.30, fat: 0.55 },
    snack: { protein: 0.15, carbs: 0.30, fat: 0.55 },
    dinner: { protein: 0.25, carbs: 0.41, fat: 0.34 }
  };

  const ratio = ratios[mealType] || ratios.dinner;

  return {
    calories: Math.round(targetCalories),
    protein: Math.round(targetCalories * ratio.protein / 4), // 4 cal/g protein
    carbs: Math.round(targetCalories * ratio.carbs / 4), // 4 cal/g carbs
    fat: Math.round(targetCalories * ratio.fat / 9) // 9 cal/g fat
  };
}

/**
 * Create fallback recipe when search fails
 * @param {string} mealName - Name of the meal
 * @param {string} mealType - Type of meal
 * @param {number} calories - Target calories
 * @returns {Object} Fallback recipe data
 */
function createFallbackRecipe(mealName, mealType, calories) {
  return {
    title: mealName,
    cuisine: 'unknown',
    ingredients: [
      'Main ingredients vary by recipe',
      'Seasonings to taste',
      'Cook according to recipe instructions'
    ],
    instructions: [
      'Prepare ingredients according to standard cooking methods',
      'Cook until done',
      'Season to taste',
      'Serve hot'
    ],
    nutrition: estimateNutrition(mealType, calories),
    source: 'fallback_template',
    url: null
  };
}

/**
 * Search for a recipe online (placeholder for web_search integration)
 * NOTE: This is designed to work with OpenClaw's web_search tool
 * The calling code should handle actual web_search calls
 *
 * @param {string} mealName - Name of the meal to search for
 * @param {string} cuisine - Cuisine type (slavic/asian)
 * @returns {Object} Search query to use with web_search
 */
function buildSearchQuery(mealName, cuisine) {
  return `${mealName} ${cuisine} recipe ingredients instructions`;
}

/**
 * Parse search results into structured recipe data
 * @param {string} mealName - Original meal name
 * @param {string} mealType - Type of meal (breakfast/snack/dinner)
 * @param {number} calories - Target calories
 * @param {Array} searchResults - Results from web_search
 * @returns {Object} Structured recipe data
 */
function parseRecipeFromSearch(mealName, mealType, calories, searchResults) {
  if (!searchResults || searchResults.length === 0) {
    return createFallbackRecipe(mealName, mealType, calories);
  }

  // Use the first (best) result
  const bestResult = searchResults[0];

  return {
    title: bestResult.title || mealName,
    cuisine: 'unknown',
    ingredients: parseIngredients(bestResult.snippet || ''),
    instructions: parseInstructions(bestResult.snippet || ''),
    nutrition: estimateNutrition(mealType, calories),
    source: 'web_search',
    url: bestResult.url || null
  };
}

/**
 * Get detailed recipe using web_fetch (if available)
 * @param {string} url - URL to fetch recipe from
 * @param {string} mealName - Original meal name
 * @param {string} mealType - Type of meal
 * @param {number} calories - Target calories
 * @returns {Promise<Object>} Detailed recipe data
 */
async function fetchDetailedRecipe(url, mealName, mealType, calories) {
  try {
    // This would use web_fetch if available
    // For now, return a recipe indicating it needs detailed fetching
    return {
      title: mealName,
      cuisine: 'unknown',
      ingredients: ['Detailed ingredients need web_fetch'],
      instructions: ['Detailed instructions need web_fetch'],
      nutrition: estimateNutrition(mealType, calories),
      source: 'needs_fetch',
      url: url
    };
  } catch (error) {
    console.error(`Error fetching recipe from ${url}:`, error.message);
    return createFallbackRecipe(mealName, mealType, calories);
  }
}

module.exports = {
  parseIngredients,
  parseInstructions,
  estimateNutrition,
  createFallbackRecipe,
  buildSearchQuery,
  parseRecipeFromSearch,
  fetchDetailedRecipe
};
