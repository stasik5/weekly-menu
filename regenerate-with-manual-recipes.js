/**
 * Regenerate menu using manual recipes (skip agent research)
 */

const fs = require('fs');
const path = require('path');

// Import our modules
const menuGenerator = require('./src/menu-generator');
const recipeFetcher = require('./src/recipe-fetcher');
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

async function generateWeeklyMenuWithManualRecipes() {
  console.log('='.repeat(50));
  console.log('Weekly Grocery Planner - Manual Recipe Mode');
  console.log('='.repeat(50));

  // Step 1: Generate menu plan
  console.log('\n1. Generating menu plan...');
  const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);
  console.log(`✓ Generated menu for ${menuGenerator.DAYS.length} days`);

  // Step 2: Load manual recipes from recipes-data.json
  console.log('\n2. Loading manual recipes...');
  const recipesDataPath = path.join(__dirname, 'output', 'recipes-data.json');

  if (!fs.existsSync(recipesDataPath)) {
    throw new Error(`Manual recipes file not found: ${recipesDataPath}`);
  }

  const recipesData = recipeFetcher.loadRecipesFromJSON(recipesDataPath);
  let planWithRecipes = recipeFetcher.attachRecipesToMeals(weeklyPlan, recipesData);
  console.log('✓ Recipes attached to meals');

  // Step 3: Chef review
  console.log('\n3. Running chef review...');
  const chefReview = chefReviewer.reviewMenu(planWithRecipes);
  if (chefReview.modified) {
    console.log('✓ Menu optimized based on chef suggestions');
    planWithRecipes = chefReview.optimizedMenu;
  } else {
    console.log('✓ Menu approved by chef (no changes needed)');
  }

  // Step 4: Build grocery list with metric conversion
  console.log('\n4. Building grocery list...');
  const groceryList = groceryListBuilder.buildGroceryList(planWithRecipes);
  const metricGroceryList = groceryListBuilder.updateToMetricUnits(groceryList);
  const totalItems = Object.values(metricGroceryList).reduce((sum, items) => sum + items.length, 0);
  console.log(`✓ Grocery list built with ${totalItems} items (metric units)`);

  // Step 5: Generate virtual pantry
  console.log('\n5. Generating virtual pantry...');
  const pantry = pantryManager.generatePantryFromGroceryList(metricGroceryList, planWithRecipes);
  console.log(`✓ Virtual pantry created with ${Object.keys(pantry).length} items`);

  // Step 6: Generate HTML
  console.log('\n6. Generating HTML site...');
  const weekLabel = siteGenerator.getWeekLabel();
  const html = siteGenerator.generateHTML(planWithRecipes, metricGroceryList, pantry, weekLabel);
  console.log(`✓ HTML generated for ${weekLabel}`);

  // Step 7: Save files
  console.log('\n7. Saving files...');
  const outputDir = path.join(__dirname, config.output.weeklyDir, weekLabel);
  const htmlPath = path.join(outputDir, 'index.html');
  const jsonPath = path.join(outputDir, 'recipes.json');
  const pantryPath = path.join(outputDir, 'pantry.json');

  siteGenerator.saveHTML(html, htmlPath);
  siteGenerator.saveRecipesJSON(planWithRecipes, jsonPath);
  pantryManager.savePantryJSON(pantry, pantryPath);

  console.log(`✓ HTML saved to: ${htmlPath}`);
  console.log(`✓ JSON saved to: ${jsonPath}`);
  console.log(`✓ Pantry saved to: ${pantryPath}`);

  // Step 8: Publish to GitHub
  console.log('\n8. Publishing to GitHub...');
  const publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Week: ${weekLabel}`);
  console.log(`Nutrition level: ${config.nutrition}`);
  console.log(`Total grocery items: ${totalItems}`);
  console.log(`Pantry items: ${Object.keys(pantry).length}`);
  console.log(`Published: ${publishResult.success ? '✓' : '✗'}`);
  console.log(`\nOpen: ${htmlPath}`);

  return {
    success: true,
    weekLabel: weekLabel,
    htmlPath: htmlPath,
    jsonPath: jsonPath,
    pantryPath: pantryPath,
    publishResult: publishResult
  };
}

// Run the script
generateWeeklyMenuWithManualRecipes()
  .then(result => {
    console.log('\n✅ Success!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
