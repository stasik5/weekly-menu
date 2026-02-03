/**
 * Weekly Grocery Planner - Main Script
 * Orchestrates the meal planning, recipe research, and HTML generation
 */

const fs = require('fs');
const path = require('path');

// Import our modules
const menuGenerator = require('./src/menu-generator');
const recipeResearcher = require('./src/recipe-researcher');
const groceryListBuilder = require('./src/grocery-list-builder');
const nutrition = require('./src/nutrition');
const siteGenerator = require('./src/site-generator');

// Load configuration
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

/**
 * Research recipes for all meals using web_search
 * This would typically use the OpenClaw web_search tool
 * For now, we'll use fallback templates
 */
async function researchRecipes(weeklyPlan) {
  console.log('Researching recipes...');

  const planWithRecipes = JSON.parse(JSON.stringify(weeklyPlan));

  for (const [day, meals] of Object.entries(planWithRecipes)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      // For Phase 1-2, use fallback recipes
      // In a full implementation, this would call web_search
      const fallbackRecipe = recipeResearcher.createFallbackRecipe(
        mealData.name,
        mealType,
        mealData.targetCalories
      );

      planWithRecipes[day][mealType].recipe = fallbackRecipe;
    }
  }

  console.log('✓ Recipe research complete');
  return planWithRecipes;
}

/**
 * Generate weekly menu and all associated files
 */
async function generateWeeklyMenu() {
  console.log('='.repeat(50));
  console.log('Weekly Grocery Planner');
  console.log('='.repeat(50));

  // Step 1: Generate menu plan
  console.log('\n1. Generating menu plan...');
  const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);
  console.log(`✓ Generated menu for ${menuGenerator.DAYS.length} days`);

  // Step 2: Research recipes
  console.log('\n2. Researching recipes...');
  const planWithRecipes = await researchRecipes(weeklyPlan);
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

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Week: ${weekLabel}`);
  console.log(`Nutrition level: ${config.nutrition}`);
  console.log(`Total grocery items: ${totalItems}`);
  console.log(`\nOpen: ${htmlPath}`);

  return {
    weekLabel,
    htmlPath,
    jsonPath,
    nutritionSummary
  };
}

// Run if called directly
if (require.main === module) {
  generateWeeklyMenu()
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

module.exports = { generateWeeklyMenu };
