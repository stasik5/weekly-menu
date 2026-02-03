#!/usr/bin/env node

/**
 * Research Recipes - Agent Script for Recipe Research
 *
 * This script is meant to be called by OpenClaw (which has access to web_search).
 * It loads the weekly menu, searches for recipes using web_search, and saves
 * the results to a JSON file.
 *
 * Usage:
 *   node research-recipes.js [menu-json-path] [output-json-path]
 *
 * Default paths:
 *   menu-json-path: output/menu.json
 *   output-json-path: output/recipes-data.json
 */

const fs = require('fs');
const path = require('path');

// Import recipe researcher utilities
const recipeResearcher = require('./src/recipe-researcher');

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);

  return {
    menuPath: args[0] || path.join(__dirname, 'output', 'menu.json'),
    outputPath: args[1] || path.join(__dirname, 'output', 'recipes-data.json')
  };
}

/**
 * Load menu from JSON file
 * @param {string} menuPath - Path to menu JSON file
 * @returns {Object} Menu data
 */
function loadMenu(menuPath) {
  try {
    const content = fs.readFileSync(menuPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading menu from ${menuPath}:`, error.message);
    throw error;
  }
}

/**
 * Extract unique meal names from menu
 * @param {Object} menu - Menu data
 * @returns {Array} Unique meal names
 */
function extractUniqueMeals(menu) {
  const meals = new Set();

  for (const dayData of Object.values(menu)) {
    if (typeof dayData === 'object') {
      for (const mealData of Object.values(dayData)) {
        if (mealData && mealData.name) {
          meals.add(mealData.name);
        }
      }
    }
  }

  return Array.from(meals);
}

/**
 * Search for a recipe using web_search
 * @param {string} mealName - Name of the meal to search for
 * @param {string} cuisine - Cuisine type
 * @param {Function} webSearch - The web_search tool
 * @returns {Promise<Object>} Recipe data
 */
async function searchRecipe(mealName, cuisine, webSearch) {
  try {
    const query = recipeResearcher.buildSearchQuery(mealName, cuisine);
    console.log(`  Searching: ${query}`);

    const results = await webSearch({
      query: query,
      count: 3
    });

    return results || [];
  } catch (error) {
    console.error(`  Search error for "${mealName}":`, error.message);
    return [];
  }
}

/**
 * Research recipes for all meals in the menu
 * @param {Array} meals - Array of meal objects
 * @param {Function} webSearch - The web_search tool
 * @returns {Promise<Object>} Recipes data keyed by meal name
 */
async function researchRecipes(meals, webSearch) {
  console.log('\n🔍 Researching recipes...\n');

  const recipesData = {};
  let successCount = 0;
  let failureCount = 0;

  for (const meal of meals) {
    const { name, cuisine, mealType, calories } = meal;

    console.log(`\n"${name}" (${cuisine} ${mealType}):`);

    // Search for the recipe
    const searchResults = await searchRecipe(name, cuisine, webSearch);

    // Parse results into structured recipe data
    const recipe = recipeResearcher.parseRecipeFromSearch(
      name,
      mealType,
      calories,
      searchResults
    );

    recipesData[name] = recipe;

    if (recipe.source === 'web_search') {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log(`\n✓ Research complete: ${successCount} found, ${failureCount} fallbacks\n`);

  return recipesData;
}

/**
 * Save recipes data to JSON file
 * @param {Object} recipesData - Recipes data
 * @param {string} outputPath - Path to save file
 */
function saveRecipesData(recipesData, outputPath) {
  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(recipesData, null, 2), 'utf8');
    console.log(`✓ Saved ${Object.keys(recipesData).length} recipes to: ${outputPath}`);
  } catch (error) {
    console.error(`Error saving recipes to ${outputPath}:`, error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('Recipe Researcher - Agent Script');
  console.log('='.repeat(50));

  const args = parseArgs();
  console.log(`Menu path: ${args.menuPath}`);
  console.log(`Output path: ${args.outputPath}\n`);

  // Check if web_search is available
  if (typeof web_search !== 'function') {
    console.error('ERROR: web_search tool is not available!');
    console.error('This script must be run in an OpenClaw agent context.');
    console.error('The Node.js script will call this via exec with proper tool access.');
    process.exit(1);
  }

  try {
    // Load menu
    console.log('Loading menu...');
    const menu = loadMenu(args.menuPath);
    console.log(`✓ Menu loaded\n`);

    // Extract unique meals
    const mealObjects = [];
    for (const [day, meals] of Object.entries(menu)) {
      for (const [mealType, mealData] of Object.entries(meals)) {
        mealObjects.push({
          name: mealData.name,
          cuisine: mealData.cuisine || 'international',
          mealType: mealType,
          calories: mealData.targetCalories
        });
      }
    }

    // Remove duplicates while preserving calorie info (use the highest calorie)
    const uniqueMeals = [];
    const mealMap = new Map();

    for (const meal of mealObjects) {
      const existing = mealMap.get(meal.name);
      if (!existing || meal.calories > existing.calories) {
        mealMap.set(meal.name, meal);
      }
    }

    const uniqueMealList = Array.from(mealMap.values());
    console.log(`Found ${uniqueMealList.length} unique meals to research\n`);

    // Research recipes using web_search
    const recipesData = await researchRecipes(uniqueMealList, web_search);

    // Save results
    saveRecipesData(recipesData, args.outputPath);

    console.log('\n' + '='.repeat(50));
    console.log('RESEARCH COMPLETE');
    console.log('='.repeat(50));

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = { main, parseArgs, loadMenu, researchRecipes, saveRecipesData };
