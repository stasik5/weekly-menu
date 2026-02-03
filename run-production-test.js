/**
 * Production Test Script - Full pipeline with web_search
 * This script runs in an OpenClaw agent environment with web_search access
 */

const fs = require('fs');
const path = require('path');

// Import modules
const menuGenerator = require('./src/menu-generator');
const recipeResearcher = require('./src/recipe-researcher');
const recipeFetcher = require('./src/recipe-fetcher');
const groceryListBuilder = require('./src/grocery-list-builder');
const nutrition = require('./src/nutrition');
const siteGenerator = require('./src/site-generator');
const publisher = require('./src/publisher');

// Load config
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function runProductionTest() {
  console.log('='.repeat(60));
  console.log('PRODUCTION TEST - Weekly Grocery Planner');
  console.log('='.repeat(60));
  console.log(`Test duration: 4 days (Wednesday-Saturday, Feb 5-8, 2026)`);
  console.log(`Current date: Tuesday, February 3, 2026`);
  console.log(`web_search: ${typeof web_search === 'function' ? '✓ Available' : '✗ Not available'}`);
  console.log('='.repeat(60));

  // Step 1: Generate menu
  console.log('\n[1] Generating menu plan...');
  const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);
  const totalMeals = Object.keys(weeklyPlan).length * 3; // 4 days × 3 meals
  console.log(`✓ Generated ${Object.keys(weeklyPlan).length} days × 3 meals = ${totalMeals} meals`);

  // Step 2: Research recipes with web_search
  console.log('\n[2] Researching recipes with web_search...');

  if (typeof web_search !== 'function') {
    console.error('✗ CRITICAL: web_search not available!');
    throw new Error('web_search tool not available in this environment');
  }

  const planWithRecipes = await recipeResearcher.researchRecipes(weeklyPlan, web_search);
  console.log('✓ Recipes attached to all meals');

  // Count real recipes vs fallbacks
  let realCount = 0;
  let fallbackCount = 0;
  for (const [day, meals] of Object.entries(planWithRecipes)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      if (mealData.recipe) {
        if (mealData.recipe.source === 'web_search') {
          realCount++;
        } else {
          fallbackCount++;
        }
      }
    }
  }
  console.log(`  Real recipes: ${realCount}, Fallback templates: ${fallbackCount}`);

  // Step 3: Build grocery list
  console.log('\n[3] Building grocery list...');
  const groceryList = groceryListBuilder.buildGroceryList(planWithRecipes);
  const categories = Object.keys(groceryList);
  const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
  console.log(`✓ Grocery list built with ${categories.length} categories, ${totalItems} total items`);
  console.log(`  Categories: ${categories.join(', ')}`);

  // Step 4: Calculate nutrition
  console.log('\n[4] Calculating nutrition...');
  const calculatedNutrition = nutrition.calculateNutrition(planWithRecipes);
  const nutritionSummary = nutrition.generateNutritionSummary(calculatedNutrition, config.nutrition);
  console.log(`✓ Daily avg: ${nutritionSummary.actual.daily.calories} kcal`);
  console.log(`  Protein: ${nutritionSummary.actual.daily.protein}g, Carbs: ${nutritionSummary.actual.daily.carbs}g, Fat: ${nutritionSummary.actual.daily.fat}g`);

  // Step 5: Generate HTML
  console.log('\n[5] Generating HTML site...');
  const weekLabel = siteGenerator.getWeekLabel();
  const html = siteGenerator.generateHTML(planWithRecipes, groceryList, nutritionSummary, weekLabel);
  console.log(`✓ HTML generated for ${weekLabel}`);

  // Step 6: Save files
  console.log('\n[6] Saving files...');

  // Save menu.json
  const menuPath = path.join(__dirname, 'output', 'menu.json');
  fs.writeFileSync(menuPath, JSON.stringify(weeklyPlan, null, 2), 'utf8');
  console.log(`✓ Saved menu.json (${Object.keys(weeklyPlan).length} days)`);

  // Save recipes-data.json
  const recipesPath = path.join(__dirname, 'output', 'recipes-data.json');
  const recipesData = {};
  for (const [day, meals] of Object.entries(planWithRecipes)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      recipesData[mealData.name] = mealData.recipe;
    }
  }
  fs.writeFileSync(recipesPath, JSON.stringify(recipesData, null, 2), 'utf8');
  console.log(`✓ Saved recipes-data.json (${Object.keys(recipesData).length} recipes)`);

  // Save weekly HTML and JSON
  const outputDir = path.join(__dirname, config.output.weeklyDir, weekLabel);
  const htmlPath = path.join(outputDir, 'index.html');
  const jsonPath = path.join(outputDir, 'recipes.json');

  siteGenerator.saveHTML(html, htmlPath);
  siteGenerator.saveRecipesJSON(planWithRecipes, jsonPath);

  console.log(`✓ Saved ${weekLabel}/index.html`);
  console.log(`✓ Saved ${weekLabel}/recipes.json`);

  // Step 7: Publish to GitHub
  console.log('\n[7] Publishing to GitHub...');
  const publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);
  if (publishResult.success) {
    console.log(`✓ Published to GitHub successfully`);
    console.log(`  Commit: ${publishResult.commitHash}`);
  } else {
    console.log(`✗ GitHub publish failed: ${publishResult.error}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('PRODUCTION TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success!`);
  console.log(`\nSummary:`);
  console.log(`  Menu: ${Object.keys(weeklyPlan).length} days × 3 meals = ${totalMeals} meals`);
  console.log(`  Recipes: ${realCount} real, ${fallbackCount} fallback templates`);
  console.log(`  Grocery list: ${categories.length} categories, ${totalItems} items`);
  console.log(`  GitHub: ${publishResult.success ? '✓ Published' : '✗ Failed'}`);
  console.log(`  HTML: ${htmlPath}`);

  // Verify real ingredients
  console.log(`\nIngredient Quality Check:`);
  let hasRealIngredients = 0;
  let hasFallbackIngredients = 0;

  for (const [day, meals] of Object.entries(planWithRecipes)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      const ingredients = mealData.recipe?.ingredients || [];
      const hasGeneric = ingredients.some(ing =>
        ing.includes('vary by recipe') ||
        ing.includes('Main ingredients') ||
        ing.includes('generic')
      );

      if (hasGeneric) {
        hasFallbackIngredients++;
      } else {
        hasRealIngredients++;
      }
    }
  }
  console.log(`  Meals with real ingredients: ${hasRealIngredients}`);
  console.log(`  Meals with placeholder ingredients: ${hasFallbackIngredients}`);

  console.log('\n' + '='.repeat(60));

  return {
    success: true,
    totalDays: Object.keys(weeklyPlan).length,
    totalMeals: totalMeals,
    realRecipes: realCount,
    fallbackRecipes: fallbackCount,
    groceryCategories: categories.length,
    groceryItems: totalItems,
    githubSuccess: publishResult.success,
    hasRealIngredients: hasRealIngredients,
    hasFallbackIngredients: hasFallbackIngredients,
    htmlPath: htmlPath,
    weekLabel: weekLabel
  };
}

// Run the test
runProductionTest()
  .then(result => {
    console.log('\n✅ Production test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Production test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
