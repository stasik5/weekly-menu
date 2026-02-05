/**
 * Weekly Grocery Planner - Main Script
 * Orchestrates the meal planning, recipe research, and HTML generation
 * UPDATED PIPELINE: menu (Russian) → recipes (Russian) → chef review → normalize → grocery list → pantry → HTML → publish
 */

const fs = require('fs');
const path = require('path');

// Import our modules
const menuGenerator = require('./src/menu-generator');
const recipeResearcher = require('./src/recipe-researcher');
const recipeFetcher = require('./src/recipe-fetcher');
const pantryNormalizer = require('./src/pantry-normalizer');
const groceryListBuilder = require('./src/grocery-list-builder');
const chefReviewer = require('./src/chef-reviewer');
const pantryManager = require('./src/pantry-manager');
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
    if (typeof web_search === 'function') {
      console.log('✓ web_search available in this environment');
      console.log('Running recipe research with web_search access...\n');

      // Import the agent module and run it directly
      const agentModule = require('./agent-research-recipes.js');
      const recipesData = await agentModule.researchAllRecipes(weeklyPlan);

      // Save the results
      const recipesDir = path.dirname(recipesJsonPath);
      if (!fs.existsSync(recipesDir)) {
        fs.mkdirSync(recipesDir, { recursive: true });
      }
      fs.writeFileSync(recipesJsonPath, JSON.stringify(recipesData, null, 2), 'utf8');
      console.log(`✓ Saved ${Object.keys(recipesData).length} recipes to: ${recipesJsonPath}\n`);

      return recipesData;
    }

    // Otherwise, try to run the agent via exec
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
    publishResult: null,
    error: null
  };

  try {
    console.log('='.repeat(50));
    console.log('Weekly Grocery Planner - Updated Pipeline');
    console.log('='.repeat(50));

    // Step 1: Generate menu plan
    console.log('\n1. Generating menu plan...');
    const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);
    console.log(`✓ Generated menu for ${menuGenerator.DAYS.length} days`);

    // Step 2: Research recipes (with web_search if available)
    console.log('\n2. Researching recipes...');
    let planWithRecipes;

    const hasGlobalWebSearch = typeof web_search === 'function';

    if (useAgent) {
      const outputDir = path.join(__dirname, 'output');
      const menuJsonPath = path.join(outputDir, 'menu.json');
      const recipesJsonPath = path.join(outputDir, 'recipes-data.json');

      const recipesData = await runAgentRecipeResearch(weeklyPlan, menuJsonPath, recipesJsonPath);
      planWithRecipes = recipeFetcher.attachRecipesToMeals(weeklyPlan, recipesData);
    } else if (hasGlobalWebSearch) {
      console.log('Using direct web_search (legacy mode)...');
      planWithRecipes = await recipeResearcher.researchRecipes(weeklyPlan, web_search);
    } else if (webSearch && typeof webSearch === 'function') {
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

    console.log('✓ Recipes attached to meals (already in Russian)');

    // Step 3: Chef review
    console.log('\n3. Running chef review...');
    const chefReview = chefReviewer.reviewMenu(planWithRecipes);
    let finalPlan = planWithRecipes;
    if (chefReview.modified) {
      console.log('✓ Menu optimized based on chef suggestions');
      finalPlan = chefReview.optimizedMenu;
    } else {
      console.log('✓ Menu approved by chef (no changes needed)');
    }

    // Step 4: Normalize ingredients (strip prep methods, merge duplicates)
    console.log('\n4. Normalizing ingredients...');
    const normalizedPlan = pantryNormalizer.normalizeWeeklyPlan(finalPlan);
    console.log('✓ Ingredients normalized (prep methods removed, duplicates merged)');

    // Step 5: Build grocery list
    console.log('\n5. Building grocery list...');
    const groceryList = groceryListBuilder.buildGroceryList(normalizedPlan);
    const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
    console.log(`✓ Grocery list built with ${totalItems} items`);

    // Step 6: Generate virtual pantry
    console.log('\n6. Generating virtual pantry...');
    const pantry = pantryManager.generatePantryFromGroceryList(groceryList, normalizedPlan);
    console.log(`✓ Virtual pantry created with ${Object.keys(pantry).length} items`);

    // Step 7: Generate HTML site
    console.log('\n7. Generating HTML site...');
    const weekLabel = siteGenerator.getWeekLabel();
    const html = siteGenerator.generateHTML(normalizedPlan, groceryList, pantry, weekLabel);
    console.log(`✓ HTML generated for ${weekLabel}`);

    // Step 8: Save files
    console.log('\n8. Saving files...');
    const outputDir = path.join(__dirname, config.output.weeklyDir, weekLabel);
    const htmlPath = path.join(outputDir, 'index.html');
    const jsonPath = path.join(outputDir, 'recipes.json');
    const pantryPath = path.join(outputDir, 'pantry.json');

    siteGenerator.saveHTML(html, htmlPath);
    siteGenerator.saveRecipesJSON(normalizedPlan, jsonPath);
    pantryManager.savePantryJSON(pantry, pantryPath);

    console.log(`✓ HTML saved to: ${htmlPath}`);
    console.log(`✓ JSON saved to: ${jsonPath}`);
    console.log(`✓ Pantry saved to: ${pantryPath}`);

    // Step 9: Publish to GitHub
    if (publish) {
      console.log('\n9. Publishing to GitHub...');
      result.publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);
    } else {
      console.log('\n9. Skipped GitHub publishing (publish=false)');
    }

    result.success = true;
    result.weekLabel = weekLabel;
    result.htmlPath = htmlPath;
    result.jsonPath = jsonPath;
    result.pantryPath = pantryPath;

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('GENERATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`Week: ${weekLabel}`);
    console.log(`Nutrition level: ${config.nutrition}`);
    console.log(`Total grocery items: ${totalItems}`);
    console.log(`Pantry items: ${Object.keys(pantry).length}`);

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
