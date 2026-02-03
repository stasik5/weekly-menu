/**
 * Weekly Grocery Planner - Main Script
 * Orchestrates the meal planning, recipe research, and HTML generation
 * Now with real web_search and GitHub auto-publishing
 */

const fs = require('fs');
const path = require('path');

// Import our modules
const menuGenerator = require('./src/menu-generator');
const recipeResearcher = require('./src/recipe-researcher');
const groceryListBuilder = require('./src/grocery-list-builder');
const nutrition = require('./src/nutrition');
const siteGenerator = require('./src/site-generator');
const publisher = require('./src/publisher');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Research recipes for all meals using web_search
 * @param {Object} weeklyPlan - Weekly meal plan from menu-generator
 * @param {Function} webSearch - The web_search tool from OpenClaw
 * @returns {Promise<Object>} Weekly plan with attached recipes
 */
async function researchRecipes(weeklyPlan, webSearch) {
  try {
    return await recipeResearcher.researchRecipes(weeklyPlan, webSearch);
  } catch (error) {
    console.error('Error researching recipes:', error.message);
    console.log('Continuing with fallback recipes...');

    // Fall back to template recipes
    const planWithRecipes = JSON.parse(JSON.stringify(weeklyPlan));

    for (const [day, meals] of Object.entries(planWithRecipes)) {
      for (const [mealType, mealData] of Object.entries(meals)) {
        const fallbackRecipe = recipeResearcher.createFallbackRecipe(
          mealData.name,
          mealType,
          mealData.targetCalories
        );

        planWithRecipes[day][mealType].recipe = fallbackRecipe;
      }
    }

    return planWithRecipes;
  }
}

/**
 * Generate weekly menu and all associated files
 * @param {Function} webSearch - The web_search tool from OpenClaw (optional)
 * @param {boolean} publish - Whether to publish to GitHub (default: true)
 * @returns {Promise<Object>} Result object
 */
async function generateWeeklyMenu(webSearch = null, publish = true) {
  const result = {
    success: false,
    weekLabel: null,
    htmlPath: null,
    jsonPath: null,
    nutritionSummary: null,
    publishResult: null,
    error: null
  };

  try {
    console.log('='.repeat(50));
    console.log('Weekly Grocery Planner - Phase 3');
    console.log('='.repeat(50));

    // Step 1: Generate menu plan
    console.log('\n1. Generating menu plan...');
    const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);
    console.log(`✓ Generated menu for ${menuGenerator.DAYS.length} days`);

    // Step 2: Research recipes (with web_search if available)
    console.log('\n2. Researching recipes...');
    let planWithRecipes;

    if (webSearch && typeof webSearch === 'function') {
      planWithRecipes = await researchRecipes(weeklyPlan, webSearch);
    } else {
      console.log('⚠️ No web_search tool provided, using fallback recipes');
      planWithRecipes = await researchRecipes(weeklyPlan, null);
    }

    console.log('✓ Recipes attached to meals');

    // Step 3: Build grocery list
    console.log('\n3. Building grocery list...');
    const groceryList = groceryListBuilder.buildGroceryList(planWithRecipes);
    const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
    console.log(`✓ Grocery list built with ${totalItems} items`);

    // Step 4: Calculate nutrition
    console.log('\n4. Calculating nutrition...');
    const calculatedNutrition = nutrition.calculateNutrition(planWithRecipes);
    const nutritionSummary = nutrition.generateNutritionSummary(calculatedNutrition, config.nutrition);
    console.log(`✓ Daily avg: ${nutritionSummary.actual.daily.calories} kcal`);
    console.log(`  Protein: ${nutritionSummary.actual.daily.protein}g, Carbs: ${nutritionSummary.actual.daily.carbs}g, Fat: ${nutritionSummary.actual.daily.fat}g`);

    // Step 5: Generate HTML
    console.log('\n5. Generating HTML site...');
    const weekLabel = siteGenerator.getWeekLabel();
    const html = siteGenerator.generateHTML(planWithRecipes, groceryList, nutritionSummary, weekLabel);
    console.log(`✓ HTML generated for ${weekLabel}`);

    // Step 6: Save files
    console.log('\n6. Saving files...');
    const outputDir = path.join(__dirname, config.output.weeklyDir, weekLabel);
    const htmlPath = path.join(outputDir, 'index.html');
    const jsonPath = path.join(outputDir, 'recipes.json');

    siteGenerator.saveHTML(html, htmlPath);
    siteGenerator.saveRecipesJSON(planWithRecipes, jsonPath);

    console.log(`✓ HTML saved to: ${htmlPath}`);
    console.log(`✓ JSON saved to: ${jsonPath}`);

    // Step 7: Publish to GitHub
    if (publish) {
      console.log('\n7. Publishing to GitHub...');
      result.publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);
    } else {
      console.log('\n7. Skipped GitHub publishing (publish=false)');
    }

    result.success = true;
    result.weekLabel = weekLabel;
    result.htmlPath = htmlPath;
    result.jsonPath = jsonPath;
    result.nutritionSummary = nutritionSummary;

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`Week: ${weekLabel}`);
    console.log(`Nutrition level: ${config.nutrition}`);
    console.log(`Total grocery items: ${totalItems}`);

    if (result.publishResult) {
      console.log(`Published: ${result.publishResult.success ? '✓' : '✗'}`);
    }

    console.log(`\nOpen: ${htmlPath}`);

    return result;

  } catch (error) {
    result.error = error.message;
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  // Check if web_search is available in the environment
  let webSearch = null;

  // Try to use web_search if available (this will be provided by OpenClaw)
  // For standalone execution, we'll use fallback recipes
  if (typeof web_search !== 'undefined') {
    webSearch = web_search;
    console.log('✓ web_search tool detected');
  } else {
    console.log('⚠️ No web_search tool available, using fallback recipes');
  }

  generateWeeklyMenu(webSearch, true)
    .then(result => {
      console.log('\n✅ Success!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { generateWeeklyMenu };
