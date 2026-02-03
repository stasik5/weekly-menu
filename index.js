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
const recipeFetcher = require('./src/recipe-fetcher');
const groceryListBuilder = require('./src/grocery-list-builder');
const nutrition = require('./src/nutrition');
const siteGenerator = require('./src/site-generator');
const publisher = require('./src/publisher');

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Run the agent script to research recipes using web_search
 * The agent script has access to web_search tool, so we call it via exec
 * @param {Object} weeklyPlan - Weekly meal plan from menu-generator
 * @param {string} menuJsonPath - Path to save menu JSON
 * @param {string} recipesJsonPath - Path where recipes JSON will be saved
 * @returns {Promise<Object>} Recipes data loaded from JSON
 */
async function runAgentRecipeResearch(weeklyPlan, menuJsonPath, recipesJsonPath) {
  console.log('\n🤖 Running agent recipe researcher...\n');

  try {
    // Save menu to JSON for the agent to read
    const menuDir = path.dirname(menuJsonPath);
    if (!fs.existsSync(menuDir)) {
      fs.mkdirSync(menuDir, { recursive: true });
    }
    fs.writeFileSync(menuJsonPath, JSON.stringify(weeklyPlan, null, 2), 'utf8');
    console.log(`✓ Saved menu to: ${menuJsonPath}`);

    // Check if we're running in OpenClaw environment with web_search
    // If yes, we can run the agent directly with web_search access
    if (typeof web_search === 'function') {
      console.log('✓ web_search available in this environment');
      console.log('Running agent script with web_search access...\n');

      const agentModule = require('./agent-research-recipes.js');
      const recipesData = await agentModule.main();
      return recipesData;
    }

    // Otherwise, try to run the agent via exec
    // OpenClaw may intercept this and provide web_search to the subprocess
    const agentScript = path.join(__dirname, 'agent-research-recipes.js');
    const command = `node "${agentScript}"`;

    console.log(`Executing: ${command}\n`);

    const { stdout, stderr } = await execAsync(command, {
      cwd: __dirname,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr) {
      console.error(stderr);
    }

    console.log(stdout);

    // Load the recipes JSON
    if (!fs.existsSync(recipesJsonPath)) {
      throw new Error(`Agent script did not create recipes file: ${recipesJsonPath}`);
    }

    const recipesData = recipeFetcher.loadRecipesFromJSON(recipesJsonPath);
    console.log(`✓ Loaded ${Object.keys(recipesData).length} recipes from agent\n`);

    return recipesData;

  } catch (error) {
    console.error('Error running agent recipe research:', error.message);
    console.log('Continuing with fallback recipes...\n');
    return {}; // Return empty object to trigger fallback
  }
}

/**
 * Generate weekly menu and all associated files
 * @param {Function} webSearch - The web_search tool from OpenClaw (optional)
 * @param {boolean} publish - Whether to publish to GitHub (default: true)
 * @param {boolean} useAgent - Whether to use agent recipe research (default: true)
 * @returns {Promise<Object>} Result object
 */
async function generateWeeklyMenu(webSearch = null, publish = true, useAgent = true) {
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

    // Check if web_search is available globally (when running from OpenClaw agent)
    const hasGlobalWebSearch = typeof web_search === 'function';

    if (useAgent) {
      // Use the new agent-based approach
      const outputDir = path.join(__dirname, 'output');
      const menuJsonPath = path.join(outputDir, 'menu.json');
      const recipesJsonPath = path.join(outputDir, 'recipes-data.json');

      const recipesData = await runAgentRecipeResearch(weeklyPlan, menuJsonPath, recipesJsonPath);
      planWithRecipes = recipeFetcher.attachRecipesToMeals(weeklyPlan, recipesData);
    } else if (hasGlobalWebSearch) {
      // Legacy mode: direct web_search (when running from OpenClaw agent)
      console.log('Using direct web_search (legacy mode)...');
      planWithRecipes = await recipeResearcher.researchRecipes(weeklyPlan, web_search);
    } else if (webSearch && typeof webSearch === 'function') {
      // Legacy mode: direct web_search via parameter
      console.log('Using direct web_search (legacy mode)...');
      planWithRecipes = await recipeResearcher.researchRecipes(weeklyPlan, webSearch);
    } else {
      // Fallback mode: use template recipes
      console.log('⚠️ No web_search tool available, using fallback recipes');
      const planWithFallback = JSON.parse(JSON.stringify(weeklyPlan));

      for (const [day, meals] of Object.entries(planWithFallback)) {
        for (const [mealType, mealData] of Object.entries(meals)) {
          const fallbackRecipe = recipeResearcher.createFallbackRecipe(
            mealData.name,
            mealType,
            mealData.targetCalories
          );

          planWithFallback[day][mealType].recipe = fallbackRecipe;
        }
      }

      planWithRecipes = planWithFallback;
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
  let hasWebSearch = false;

  if (typeof web_search !== 'undefined' && typeof web_search === 'function') {
    hasWebSearch = true;
    console.log('✓ web_search tool available in this environment');
  } else {
    console.log('⚠️ Running from Node.js - web_search tool not directly available');
    console.log('ℹ️  Using agent-based recipe research');
  }

  // Pass web_search if available, use agent approach
  generateWeeklyMenu(hasWebSearch ? web_search : null, true, true)
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
