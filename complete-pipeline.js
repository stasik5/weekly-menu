/**
 * Complete Pipeline with Real Recipes
 * Loads menu, attaches researched recipes, builds grocery list, pantry, and HTML
 */

const fs = require('fs');
const path = require('path');
const recipeFetcher = require('./src/recipe-fetcher');
const groceryListBuilder = require('./src/grocery-list-builder');
const pantryManager = require('./src/pantry-manager');
const siteGenerator = require('./src/site-generator');
const publisher = require('./src/publisher');
const chefReviewer = require('./src/chef-reviewer');

async function completePipeline() {
  console.log('='.repeat(50));
  console.log('Complete Pipeline with Real Recipes');
  console.log('='.repeat(50));

  // Step 1: Load menu
  console.log('\n1. Loading menu...');
  const menuPath = path.join(__dirname, 'output/menu.json');
  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
  console.log('✓ Menu loaded');

  // Step 2: Load researched recipes
  console.log('\n2. Loading researched recipes...');
  const recipesPath = path.join(__dirname, 'output/recipes-data.json');
  const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
  console.log(`✓ Loaded ${Object.keys(recipesData).length} recipes`);

  // Step 3: Attach recipes to menu
  console.log('\n3. Attaching recipes to menu...');
  const planWithRecipes = recipeFetcher.attachRecipesToMeals(menu, recipesData);
  console.log('✓ Recipes attached');

  // Step 4: Chef review
  console.log('\n4. Running chef review...');
  const chefReview = chefReviewer.reviewMenu(planWithRecipes);
  if (chefReview.modified) {
    console.log('✓ Menu optimized based on chef suggestions');
  } else {
    console.log('✓ Menu approved by chef');
  }

  // Step 5: Build grocery list
  console.log('\n5. Building grocery list...');
  const groceryList = groceryListBuilder.buildGroceryList(planWithRecipes);
  const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
  console.log(`✓ Grocery list built with ${totalItems} items`);

  // Step 6: Generate pantry
  console.log('\n6. Generating virtual pantry...');
  const pantry = pantryManager.generatePantryFromGroceryList(groceryList, planWithRecipes);
  console.log(`✓ Virtual pantry created with ${Object.keys(pantry).length} items`);

  // Step 7: Generate HTML
  console.log('\n7. Generating HTML site...');
  const weekLabel = siteGenerator.getWeekLabel();
  const html = siteGenerator.generateHTML(planWithRecipes, groceryList, pantry, weekLabel);
  console.log(`✓ HTML generated for ${weekLabel}`);

  // Step 8: Save files
  console.log('\n8. Saving files...');
  const outputDir = path.join(__dirname, 'output/weekly', weekLabel);
  const htmlPath = path.join(outputDir, 'index.html');
  const jsonPath = path.join(outputDir, 'recipes.json');
  const pantryPath = path.join(outputDir, 'pantry.json');
  const groceryListPath = path.join(outputDir, 'grocery-list.json');

  // Create directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  siteGenerator.saveHTML(html, htmlPath);
  siteGenerator.saveRecipesJSON(planWithRecipes, jsonPath);
  pantryManager.savePantryJSON(pantry, pantryPath);

  // Also save grocery list separately
  fs.writeFileSync(groceryListPath, JSON.stringify(groceryList, null, 2), 'utf8');

  console.log(`✓ HTML saved to: ${htmlPath}`);
  console.log(`✓ JSON saved to: ${jsonPath}`);
  console.log(`✓ Pantry saved to: ${pantryPath}`);
  console.log(`✓ Grocery list saved to: ${groceryListPath}`);

  // Step 9: Publish to GitHub
  console.log('\n9. Publishing to GitHub...');
  const publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('GENERATION COMPLETE');
  console.log('='.repeat(50));
  console.log(`Week: ${weekLabel}`);
  console.log(`Total grocery items: ${totalItems}`);
  console.log(`Pantry items: ${Object.keys(pantry).length}`);

  if (publishResult) {
    console.log(`Published: ${publishResult.success ? '✓' : '✗'}`);
  }

  console.log(`\nOpen: ${htmlPath}`);
  console.log(`GitHub: https://github.com/stasik5/weekly-menu`);

  return {
    success: true,
    weekLabel,
    htmlPath,
    jsonPath,
    pantryPath,
    groceryListPath,
    totalItems,
    pantryItems: Object.keys(pantry).length,
    publishResult
  };
}

// Run the pipeline
completePipeline()
  .then(result => {
    console.log('\n✅ Success!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
