/**
 * Recipe Fetcher - Attaches recipe data to meals
 * Takes pre-loaded recipe data (from agent web_search) and attaches it to meals
 */

const recipeResearcher = require('./recipe-researcher');

/**
 * Attach recipes to meals from pre-loaded recipe data
 * @param {Object} weeklyPlan - Weekly meal plan from menu-generator
 * @param {Object} recipesData - Pre-loaded recipe data from research-recipes.js
 * @returns {Object} Weekly plan with attached recipes
 */
function attachRecipesToMeals(weeklyPlan, recipesData) {
  console.log('\n📋 Attaching recipe data to meals...\n');

  const planWithRecipes = JSON.parse(JSON.stringify(weeklyPlan));

  for (const [day, meals] of Object.entries(planWithRecipes)) {
    console.log(`${day}:`);

    for (const [mealType, mealData] of Object.entries(meals)) {
      const mealName = mealData.name;
      const calories = mealData.targetCalories;

      // Try to find recipe data for this meal
      const recipe = recipesData[mealName];

      if (recipe) {
        console.log(`  ✓ "${mealName}" - recipe found (${recipe.source})`);
        planWithRecipes[day][mealType].recipe = recipe;
      } else {
        console.log(`  ⚠️ "${mealName}" - no recipe data, using fallback`);
        const fallbackRecipe = recipeResearcher.createFallbackRecipe(
          mealName,
          mealType,
          calories
        );
        planWithRecipes[day][mealType].recipe = fallbackRecipe;
      }
    }
  }

  console.log('\n✓ Recipe attachment complete\n');
  return planWithRecipes;
}

/**
 * Load recipe data from JSON file
 * @param {string} jsonPath - Path to recipes JSON file
 * @returns {Object} Recipe data
 */
function loadRecipesFromJSON(jsonPath) {
  const fs = require('fs');

  try {
    console.log(`Loading recipes from: ${jsonPath}`);
    const content = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(content);
    console.log(`✓ Loaded ${Object.keys(data).length} recipes\n`);
    return data;
  } catch (error) {
    console.error(`Error loading recipes from ${jsonPath}:`, error.message);
    return {};
  }
}

/**
 * Save recipe data to JSON file
 * @param {Object} recipesData - Recipe data to save
 * @param {string} jsonPath - Path to save JSON file
 */
function saveRecipesToJSON(recipesData, jsonPath) {
  const fs = require('fs');
  const path = require('path');

  try {
    const dir = path.dirname(jsonPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(jsonPath, JSON.stringify(recipesData, null, 2), 'utf8');
    console.log(`✓ Saved ${Object.keys(recipesData).length} recipes to: ${jsonPath}`);
  } catch (error) {
    console.error(`Error saving recipes to ${jsonPath}:`, error.message);
    throw error;
  }
}

/**
 * Validate recipe data structure
 * @param {Object} recipe - Recipe data to validate
 * @returns {boolean} True if valid
 */
function validateRecipe(recipe) {
  return recipe &&
         typeof recipe.title === 'string' &&
         Array.isArray(recipe.ingredients) &&
         Array.isArray(recipe.instructions) &&
         recipe.nutrition &&
         typeof recipe.nutrition.calories === 'number';
}

/**
 * Normalize recipe data (ensure all required fields exist)
 * @param {Object} recipe - Recipe data to normalize
 * @param {string} mealName - Fallback meal name
 * @param {string} mealType - Meal type for fallback nutrition
 * @param {number} calories - Target calories
 * @returns {Object} Normalized recipe data
 */
function normalizeRecipe(recipe, mealName, mealType, calories) {
  if (!recipe) {
    return recipeResearcher.createFallbackRecipe(mealName, mealType, calories);
  }

  const normalized = {
    title: recipe.title || mealName,
    cuisine: recipe.cuisine || 'unknown',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : recipeResearcher.generateGenericIngredients(),
    instructions: Array.isArray(recipe.instructions) ? recipe.instructions : recipeResearcher.generateGenericInstructions(),
    nutrition: recipe.nutrition || recipeResearcher.estimateNutrition(mealType, calories),
    source: recipe.source || 'normalized',
    url: recipe.url || null
  };

  // Ensure nutrition has all required fields
  normalized.nutrition = {
    calories: normalized.nutrition.calories || calories,
    protein: normalized.nutrition.protein || 0,
    carbs: normalized.nutrition.carbs || 0,
    fat: normalized.nutrition.fat || 0
  };

  return normalized;
}

module.exports = {
  attachRecipesToMeals,
  loadRecipesFromJSON,
  saveRecipesToJSON,
  validateRecipe,
  normalizeRecipe
};
