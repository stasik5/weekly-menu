/**
 * Run Weekly Menu Generation with pre-existing real recipes
 * This script skips the agent research and uses existing recipes-data.json
 */

const fs = require('fs');
const path = require('path');

// Import modules
const menuGenerator = require('./src/menu-generator');
const recipeFetcher = require('./src/recipe-fetcher');
const groceryListBuilder = require('./src/grocery-list-builder');
const nutrition = require('./src/nutrition');
const siteGenerator = require('./src/site-generator');
const publisher = require('./src/publisher');

const config = require('./config.json');

async function generateWithRealRecipes() {
  console.log('='.repeat(50));
  console.log('Weekly Grocery Planner - Using Real Recipes');
  console.log('='.repeat(50));

  // Step 1: Generate menu plan
  console.log('\n1. Generating menu plan...');
  const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);
  console.log(`✓ Generated menu for ${menuGenerator.DAYS.length} days`);

  // Save menu to JSON (for reference)
  const outputDir = path.join(__dirname, 'output');
  const menuJsonPath = path.join(outputDir, 'menu.json');
  fs.writeFileSync(menuJsonPath, JSON.stringify(weeklyPlan, null, 2), 'utf8');

  // Step 2: Load real recipes from existing recipes-data.json
  console.log('\n2. Loading real recipes from recipes-data.json...');
  const recipesJsonPath = path.join(outputDir, 'recipes-data.json');

  if (!fs.existsSync(recipesJsonPath)) {
    console.error('ERROR: recipes-data.json not found!');
    console.error('Please create real recipes first.');
    process.exit(1);
  }

  const recipesData = recipeFetcher.loadRecipesFromJSON(recipesJsonPath);
  console.log(`✓ Loaded ${Object.keys(recipesData).length} recipes`);

  // Step 3: Attach recipes to meals
  console.log('\n3. Attaching recipes to meals...');
  const planWithRecipes = recipeFetcher.attachRecipesToMeals(weeklyPlan, recipesData);

  // Count how many recipes matched
  let matchCount = 0;
  for (const [day, meals] of Object.entries(planWithRecipes)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      if (mealData.recipe && mealData.recipe.source !== 'fallback_template') {
        matchCount++;
      }
    }
  }
  console.log(`✓ ${matchCount} real recipes attached, ${12 - matchCount} using fallbacks`);

  // Step 4: Build grocery list
  console.log('\n4. Building grocery list...');
  const groceryList = groceryListBuilder.buildGroceryList(planWithRecipes);
  const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
  console.log(`✓ Grocery list built with ${totalItems} items`);

  // Step 5: Calculate nutrition
  console.log('\n5. Calculating nutrition...');
  const calculatedNutrition = nutrition.calculateNutrition(planWithRecipes);
  const nutritionSummary = nutrition.generateNutritionSummary(calculatedNutrition, config.nutrition);
  console.log(`✓ Daily avg: ${nutritionSummary.actual.daily.calories} kcal`);

  // Step 6: Generate HTML
  console.log('\n6. Generating HTML site...');
  const weekLabel = siteGenerator.getWeekLabel();
  const html = siteGenerator.generateHTML(planWithRecipes, groceryList, nutritionSummary, weekLabel);
  console.log(`✓ HTML generated for ${weekLabel}`);

  // Step 7: Save files
  console.log('\n7. Saving files...');
  const weeklyDir = path.join(__dirname, config.output.weeklyDir, weekLabel);
  const htmlPath = path.join(weeklyDir, 'index.html');
  const jsonPath = path.join(weeklyDir, 'recipes.json');

  siteGenerator.saveHTML(html, htmlPath);
  siteGenerator.saveRecipesJSON(planWithRecipes, jsonPath);

  console.log(`✓ HTML saved to: ${htmlPath}`);
  console.log(`✓ JSON saved to: ${jsonPath}`);

  // Step 8: Publish to GitHub
  console.log('\n8. Publishing to GitHub...');
  const publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Week: ${weekLabel}`);
  console.log(`Real recipes: ${matchCount}/12`);
  console.log(`Grocery items: ${totalItems}`);
  console.log(`Nutrition level: ${config.nutrition}`);

  if (publishResult && publishResult.success) {
    console.log(`\n📤 Published to GitHub!`);
    console.log(`URL: https://github.com/stasik5/weekly-menu`);
  }

  console.log(`\nOpen: ${htmlPath}`);

  return {
    success: true,
    weekLabel,
    htmlPath,
    jsonPath,
    realRecipes: matchCount,
    totalItems,
    groceryList
  };
}

// Run if called directly
if (require.main === module) {
  generateWithRealRecipes()
    .then(result => {
      console.log('\n✅ Success!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { generateWithRealRecipes };
