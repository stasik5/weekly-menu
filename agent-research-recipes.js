/**
 * OpenClaw Agent Script for Recipe Research
 *
 * This script is designed to be run by an OpenClaw agent with web_search access.
 * It loads the weekly menu, searches for recipes using web_search, and saves
 * the results to a JSON file.
 *
 * To run this from the main script:
 * 1. Generate menu and save to output/menu.json
 * 2. Call this agent (it will have web_search access)
 * 3. Load the results from output/recipes-data.json
 */

// This script will be called by OpenClaw with web_search available
// When called via exec from index.js, OpenClaw can intercept and provide access

// Import recipe researcher utilities
const recipeResearcher = require('./src/recipe-researcher');
const fs = require('fs');
const path = require('path');

/**
 * Research recipes using web_search
 * @param {Object} menu - Menu data with meals
 * @returns {Promise<Object>} Recipes data
 */
async function researchAllRecipes(menu) {
  console.log('\n🔍 Researching recipes using web_search...\n');

  // Collect unique meals
  const mealMap = new Map();

  for (const [day, meals] of Object.entries(menu)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      const key = mealData.name;

      if (!mealMap.has(key)) {
        mealMap.set(key, {
          name: mealData.name,
          cuisine: mealData.cuisine || 'international',
          mealType: mealType,
          calories: mealData.targetCalories
        });
      }
    }
  }

  const uniqueMeals = Array.from(mealMap.values());
  console.log(`Found ${uniqueMeals.length} unique meals to research\n`);

  const recipesData = {};
  let successCount = 0;
  let fallbackCount = 0;

  for (const meal of uniqueMeals) {
    const { name, cuisine, mealType, calories } = meal;

    console.log(`"${name}" (${cuisine} ${mealType}):`);

    // Check if web_search is available
    if (typeof web_search !== 'function') {
      console.log('  ⚠️ web_search not available, using fallback');
      recipesData[name] = recipeResearcher.createFallbackRecipe(name, mealType, calories);
      fallbackCount++;
      continue;
    }

    try {
      // Build search query
      const query = recipeResearcher.buildSearchQuery(name, cuisine);
      console.log(`  Searching: ${query}`);

      // Search using web_search tool
      const results = await web_search({
        query: query,
        count: 3
      });

      // Parse results
      const recipe = recipeResearcher.parseRecipeFromSearch(
        name,
        mealType,
        calories,
        results || []
      );

      recipesData[name] = recipe;

      if (recipe.source === 'web_search') {
        successCount++;
        console.log(`  ✓ Found: ${recipe.title}`);
      } else {
        fallbackCount++;
        console.log(`  ⚠️ Using fallback`);
      }

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      recipesData[name] = recipeResearcher.createFallbackRecipe(name, mealType, calories);
      fallbackCount++;
    }
  }

  console.log(`\n✓ Research complete: ${successCount} found, ${fallbackCount} fallbacks\n`);

  return recipesData;
}

/**
 * Main function for the agent
 */
async function main() {
  console.log('='.repeat(50));
  console.log('Recipe Research Agent');
  console.log('='.repeat(50));

  try {
    // Paths
    const menuPath = path.join(__dirname, 'output', 'menu.json');
    const recipesPath = path.join(__dirname, 'output', 'recipes-data.json');

    // Load menu
    console.log(`\nLoading menu from: ${menuPath}`);
    if (!fs.existsSync(menuPath)) {
      throw new Error(`Menu file not found: ${menuPath}\nPlease run the main script first to generate the menu.`);
    }

    const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    console.log(`✓ Menu loaded\n`);

    // Research recipes
    const recipesData = await researchAllRecipes(menu);

    // Save recipes
    const dir = path.dirname(recipesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(recipesPath, JSON.stringify(recipesData, null, 2), 'utf8');
    console.log(`✓ Saved ${Object.keys(recipesData).length} recipes to: ${recipesPath}`);

    console.log('\n' + '='.repeat(50));
    console.log('AGENT COMPLETE');
    console.log('='.repeat(50));

    return recipesData;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Export for use by OpenClaw
module.exports = { main, researchAllRecipes };

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Agent completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Agent failed:', error.message);
      process.exit(1);
    });
}
