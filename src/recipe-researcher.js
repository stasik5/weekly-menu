/**
 * Recipe Researcher - Finds and extracts recipe information
 * Uses web_search to find real recipes and extract structured data
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
    // Look for lines that look like ingredients (e.g., "2 cups flour", "1 egg", "300g chicken")
    if (/^\d+/.test(trimmed) && trimmed.length > 3 && trimmed.length < 200) {
      // Clean up common web text artifacts
      const cleaned = trimmed
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\d+\.\s*/, '') // Remove list numbers
        .replace(/^-/, '')
        .trim();

      if (cleaned.length > 2) {
        ingredients.push(cleaned);
      }
    }
  }

  return ingredients.length > 0 ? ingredients : generateGenericIngredients();
}

/**
 * Generate generic ingredients when parsing fails
 * @returns {Array} Generic ingredient list
 */
function generateGenericIngredients() {
  return [
    'Main protein or vegetable base',
    'Seasonings and spices to taste',
    'Oil or cooking fat',
    'Optional garnish'
  ];
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
    const isNumbered = /^\d+\./.test(trimmed);
    const hasActionVerb = /^(mix|add|cook|bake|fry|boil|sauté|chop|stir|combine|whisk|blend|heat|place|pour|serve|season|sprinkle)/i.test(trimmed);

    if (isNumbered || hasActionVerb) {
      // Clean up the instruction
      const cleaned = trimmed
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^-/, '')
        .trim();

      if (cleaned.length > 5) {
        instructions.push(cleaned);
      }
    }
  }

  return instructions.length > 0 ? instructions : generateGenericInstructions();
}

/**
 * Generate generic instructions when parsing fails
 * @returns {Array} Generic instruction list
 */
function generateGenericInstructions() {
  return [
    'Prepare all ingredients before starting',
    'Cook according to standard methods',
    'Season to taste throughout',
    'Serve hot and enjoy'
  ];
}

/**
 * Extract nutrition information from text
 * @param {string} text - Recipe text containing nutrition info
 * @param {number} targetCalories - Target calorie count
 * @returns {Object} Nutrition info
 */
function extractNutrition(text, targetCalories) {
  // Try to extract from common nutrition formats
  const calorieMatch = text.match(/(\d+)\s*(?:cal|calories|kcal)/i);
  const proteinMatch = text.match(/(\d+)\s*(?:g\s*protein|protein\s*g)/i);
  const carbsMatch = text.match(/(\d+)\s*(?:g\s*carbs|carbs\s*g|carbohydrates)/i);
  const fatMatch = text.match(/(\d+)\s*(?:g\s*fat|fat\s*g)/i);

  return {
    calories: calorieMatch ? parseInt(calorieMatch[1]) : Math.round(targetCalories),
    protein: proteinMatch ? parseInt(proteinMatch[1]) : Math.round(targetCalories * 0.2 / 4),
    carbs: carbsMatch ? parseInt(carbsMatch[1]) : Math.round(targetCalories * 0.35 / 4),
    fat: fatMatch ? parseInt(fatMatch[1]) : Math.round(targetCalories * 0.45 / 9)
  };
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
 * Build search query for web_search
 * @param {string} mealName - Name of the meal to search for
 * @param {string} cuisine - Cuisine type (slavic/asian)
 * @returns {string} Search query
 */
function buildSearchQuery(mealName, cuisine) {
  return `${mealName} ${cuisine} recipe ingredients instructions`;
}

/**
 * Search for a recipe using web_search
 * This function should be called with access to the web_search tool
 *
 * @param {Object} webSearch - The web_search tool from OpenClaw
 * @param {string} mealName - Name of the meal
 * @param {string} cuisine - Cuisine type
 * @returns {Promise<Array>} Search results
 */
async function searchForRecipe(webSearch, mealName, cuisine) {
  try {
    const query = buildSearchQuery(mealName, cuisine);
    console.log(`  Searching: ${query}`);

    // Use the web_search tool - this will be provided by the calling code
    const results = await webSearch({
      query: query,
      count: 3 // Get top 3 results
    });

    return results || [];
  } catch (error) {
    console.error(`  Search error for "${mealName}":`, error.message);
    return [];
  }
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
    console.log(`  No results for "${mealName}", using fallback`);
    return createFallbackRecipe(mealName, mealType, calories);
  }

  // Use the first (best) result
  const bestResult = searchResults[0];

  console.log(`  Found: ${bestResult.title}`);

  // Extract ingredients from snippet
  const ingredients = parseIngredients(bestResult.snippet || '');

  // Extract instructions from snippet
  const instructions = parseInstructions(bestResult.snippet || '');

  // Extract or estimate nutrition
  const nutrition = extractNutrition(bestResult.snippet || '', calories);

  return {
    title: bestResult.title || mealName,
    cuisine: 'unknown', // Could try to extract from snippet
    ingredients: ingredients,
    instructions: instructions,
    nutrition: nutrition,
    source: 'web_search',
    url: bestResult.url || null
  };
}

/**
 * Research recipes for all meals using web_search
 * This is the main function that orchestrates the recipe research
 *
 * @param {Object} weeklyPlan - Weekly meal plan from menu-generator
 * @param {Object} webSearch - The web_search tool from OpenClaw
 * @returns {Promise<Object>} Weekly plan with attached recipes
 */
async function researchRecipes(weeklyPlan, webSearch) {
  console.log('\n🔍 Researching recipes for all meals...\n');

  const planWithRecipes = JSON.parse(JSON.stringify(weeklyPlan));

  for (const [day, meals] of Object.entries(planWithRecipes)) {
    console.log(`${day}:`);

    for (const [mealType, mealData] of Object.entries(meals)) {
      const mealName = mealData.name;
      const cuisine = mealData.cuisine || 'international';
      const calories = mealData.targetCalories;

      // Search for the recipe
      const searchResults = await searchForRecipe(webSearch, mealName, cuisine);

      // Parse results into structured recipe data
      const recipe = parseRecipeFromSearch(mealName, mealType, calories, searchResults);

      // Attach to the meal
      planWithRecipes[day][mealType].recipe = recipe;
    }
  }

  console.log('\n✓ Recipe research complete\n');
  return planWithRecipes;
}

/**
 * Get detailed recipe using web_fetch (if available)
 * @param {string} url - URL to fetch recipe from
 * @param {string} mealName - Original meal name
 * @param {string} mealType - Type of meal
 * @param {number} calories - Target calories
 * @param {Object} webFetch - The web_fetch tool from OpenClaw
 * @returns {Promise<Object>} Detailed recipe data
 */
async function fetchDetailedRecipe(url, mealName, mealType, calories, webFetch) {
  try {
    if (!webFetch) {
      throw new Error('webFetch tool not available');
    }

    console.log(`Fetching detailed recipe from ${url}`);

    const content = await webFetch({
      url: url,
      extractMode: 'markdown',
      maxChars: 10000
    });

    // Parse the fetched content
    const ingredients = parseIngredients(content);
    const instructions = parseInstructions(content);
    const nutrition = extractNutrition(content, calories);

    return {
      title: mealName,
      cuisine: 'unknown',
      ingredients: ingredients,
      instructions: instructions,
      nutrition: nutrition,
      source: 'web_fetch',
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
  extractNutrition,
  estimateNutrition,
  createFallbackRecipe,
  buildSearchQuery,
  searchForRecipe,
  parseRecipeFromSearch,
  researchRecipes,
  fetchDetailedRecipe
};
