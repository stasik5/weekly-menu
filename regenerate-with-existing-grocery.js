/**
 * Regenerate HTML using existing grocery list and pantry
 */

const fs = require('fs');
const path = require('path');

// Import our modules
const pantryManager = require('./src/pantry-manager');
const siteGenerator = require('./src/site-generator');
const recipeFetcher = require('./src/recipe-fetcher');

async function regenerateHTML() {
  console.log('Regenerating HTML with existing grocery list...\n');

  // Load the existing grocery list
  const groceryDataPath = path.join(__dirname, 'output/weekly/2026-W06/grocery-list.json');
  const groceryData = JSON.parse(fs.readFileSync(groceryDataPath, 'utf8'));

  console.log(`✓ Loaded grocery list with ${groceryData.summary.totalItems} items\n`);

  // Load menu
  const menuPath = path.join(__dirname, 'output/menu.json');
  const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

  // Load recipes
  const recipesPath = path.join(__dirname, 'output/recipes-data.json');
  const recipes = recipeFetcher.loadRecipesFromJSON(recipesPath);
  const planWithRecipes = recipeFetcher.attachRecipesToMeals(menu, recipes);

  console.log('✓ Loaded menu and recipes\n');

  // Generate pantry from existing grocery list
  console.log('Generating pantry from grocery list...');
  const pantry = pantryManager.generatePantryFromGroceryList(groceryData.groceryList, planWithRecipes);
  console.log(`✓ Generated pantry with ${Object.keys(pantry).length} items\n`);

  // Generate HTML
  console.log('Generating HTML...');
  const weekLabel = '2026-W06';
  const html = siteGenerator.generateHTML(planWithRecipes, groceryData.groceryList, pantry, weekLabel);

  // Save files
  console.log('Saving files...');
  const outputDir = path.join(__dirname, 'output/weekly', weekLabel);
  const htmlPath = path.join(outputDir, 'index.html');
  const pantryPath = path.join(outputDir, 'pantry.json');

  siteGenerator.saveHTML(html, htmlPath);
  pantryManager.savePantryJSON(pantry, pantryPath);

  console.log(`✓ HTML saved to: ${htmlPath}`);
  console.log(`✓ Pantry saved to: ${pantryPath}`);

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`Week: ${weekLabel}`);
  console.log(`Grocery items: ${groceryData.summary.totalItems}`);
  console.log(`Pantry items: ${Object.keys(pantry).length}`);

  // Show sample pantry items with low quantities
  console.log('\nSample pantry items (lowest remaining first):');
  const items = Object.entries(pantry)
    .sort((a, b) => a[1].remaining / a[1].total - b[1].remaining / b[1].total)
    .slice(0, 10);

  for (const [key, item] of items) {
    const pct = Math.round((item.remaining / item.total) * 100);
    console.log(`  - ${item.name}: ${item.remaining}/${item.total}${item.unit} (${pct}% remaining)`);
  }

  console.log(`\nOpen: ${htmlPath}`);
}

regenerateHTML()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
