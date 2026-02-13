/**
 * Rebuild grocery list and HTML from simplified recipes
 * This script takes the simplified recipes.json and rebuilds all derived files
 */

const fs = require('fs');
const path = require('path');
const groceryListBuilder = require('./src/grocery-list-builder');
const pantryManager = require('./src/pantry-manager');
const siteGenerator = require('./src/site-generator');

async function rebuildFromSimplified(weekLabel = '2026-W06') {
  console.log('='.repeat(50));
  console.log('Rebuilding from Simplified Recipes');
  console.log('='.repeat(50));

  // Step 1: Load simplified recipes
  console.log('\n1. Loading simplified recipes...');
  const recipesPath = path.join(__dirname, 'output/weekly', weekLabel, 'recipes.json');
  const planWithRecipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
  
  const totalMeals = Object.values(planWithRecipes).reduce((sum, day) => {
    return sum + Object.keys(day).length;
  }, 0);
  
  console.log(`✓ Loaded ${totalMeals} meals from simplified recipes`);

  // Step 2: Build grocery list
  console.log('\n2. Building grocery list...');
  const groceryList = groceryListBuilder.buildGroceryList(planWithRecipes);
  const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
  console.log(`✓ Grocery list built with ${totalItems} items`);

  // Step 3: Generate pantry
  console.log('\n3. Generating virtual pantry...');
  const pantry = pantryManager.generatePantryFromGroceryList(groceryList, planWithRecipes);
  console.log(`✓ Virtual pantry created with ${Object.keys(pantry).length} items`);

  // Step 4: Generate HTML
  console.log('\n4. Generating HTML site...');
  const html = siteGenerator.generateHTML(planWithRecipes, groceryList, pantry, weekLabel);
  console.log(`✓ HTML generated for ${weekLabel}`);

  // Step 5: Save files
  console.log('\n5. Saving files...');
  const outputDir = path.join(__dirname, 'output/weekly', weekLabel);
  const htmlPath = path.join(outputDir, 'index.html');
  const pantryPath = path.join(outputDir, 'pantry.json');
  const groceryListPath = path.join(outputDir, 'grocery-list.json');

  siteGenerator.saveHTML(html, htmlPath);
  pantryManager.savePantryJSON(pantry, pantryPath);
  
  // Save grocery list separately
  fs.writeFileSync(groceryListPath, JSON.stringify(groceryList, null, 2), 'utf8');

  console.log(`✓ HTML saved to: ${htmlPath}`);
  console.log(`✓ Pantry saved to: ${pantryPath}`);
  console.log(`✓ Grocery list saved to: ${groceryListPath}`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('REBUILD COMPLETE');
  console.log('='.repeat(50));
  console.log(`Week: ${weekLabel}`);
  console.log(`Total meals: ${totalMeals}`);
  console.log(`Total grocery items: ${totalItems}`);
  console.log(`Pantry items: ${Object.keys(pantry).length}`);

  // Count simplifications
  let simplificationCount = 0;
  for (const [day, meals] of Object.entries(planWithRecipes)) {
    for (const [mealType, meal] of Object.entries(meals)) {
      if (meal.recipe && meal.recipe.note && meal.recipe.note.includes('Simplified')) {
        simplificationCount++;
      }
    }
  }
  
  console.log(`Simplified ingredients: ${simplificationCount} recipes modified`);
  console.log(`\nOpen: ${htmlPath}`);

  return {
    success: true,
    weekLabel,
    htmlPath,
    pantryPath,
    groceryListPath,
    totalMeals,
    totalItems,
    pantryItems: Object.keys(pantry).length,
    simplificationCount
  };
}

// Run if called directly
if (require.main === module) {
  const weekLabel = process.argv[2] || '2026-W06';
  
  rebuildFromSimplified(weekLabel)
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

module.exports = { rebuildFromSimplified };
