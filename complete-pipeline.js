/**
 * Complete the production pipeline from recipes-data.json
 * This script attaches recipes, builds grocery list, generates HTML, and publishes
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

// Load config
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function completePipeline() {
  console.log('='.repeat(60));
  console.log('COMPLETING PRODUCTION PIPELINE');
  console.log('='.repeat(60));

  // Load menu and recipes
  console.log('\n[Step 1] Loading menu and recipes...');

  const menuPath = path.join(__dirname, 'output', 'menu.json');
  const recipesPath = path.join(__dirname, 'output', 'recipes-data.json');

  if (!fs.existsSync(menuPath)) {
    throw new Error(`Menu file not found: ${menuPath}`);
  }
  if (!fs.existsSync(recipesPath)) {
    throw new Error(`Recipes file not found: ${recipesPath}`);
  }

  const weeklyPlan = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
  const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));

  console.log(`✓ Loaded menu: ${Object.keys(weeklyPlan).length} days`);
  console.log(`✓ Loaded recipes: ${Object.keys(recipesData).length} recipes`);

  // Step 2: Attach recipes to meals
  console.log('\n[Step 2] Attaching recipes to meals...');
  const planWithRecipes = recipeFetcher.attachRecipesToMeals(weeklyPlan, recipesData);

  for (const [day, meals] of Object.entries(planWithRecipes)) {
    console.log(`${day}:`);
    for (const [mealType, mealData] of Object.entries(meals)) {
      const source = mealData.recipe?.source || 'unknown';
      console.log(`  ✓ "${mealData.name}" - recipe found (${source})`);
    }
  }

  // Count real vs fallback recipes
  let realCount = 0;
  let fallbackCount = 0;
  for (const [day, meals] of Object.entries(planWithRecipes)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      if (mealData.recipe?.source === 'web_search') {
        realCount++;
      } else {
        fallbackCount++;
      }
    }
  }
  console.log(`\nRecipe Summary: ${realCount} real web_search, ${fallbackCount} fallback templates`);

  // Step 3: Build grocery list
  console.log('\n[Step 3] Building grocery list...');
  const groceryList = groceryListBuilder.buildGroceryList(planWithRecipes);
  const categories = Object.keys(groceryList);
  const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);

  console.log(`✓ Grocery list built with ${categories.length} categories, ${totalItems} total items`);
  console.log(`  Categories: ${categories.join(', ')}`);

  // Show sample items per category
  for (const [category, items] of Object.entries(groceryList)) {
    console.log(`    ${category}: ${items.length} items (${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''})`);
  }

  // Step 4: Calculate nutrition
  console.log('\n[Step 4] Calculating nutrition...');
  const calculatedNutrition = nutrition.calculateNutrition(planWithRecipes);
  const nutritionSummary = nutrition.generateNutritionSummary(calculatedNutrition, config.nutrition);
  console.log(`✓ Daily avg: ${nutritionSummary.actual.daily.calories} kcal`);
  console.log(`  Protein: ${nutritionSummary.actual.daily.protein}g, Carbs: ${nutritionSummary.actual.daily.carbs}g, Fat: ${nutritionSummary.actual.daily.fat}g`);

  // Step 5: Generate HTML
  console.log('\n[Step 5] Generating HTML site...');
  const weekLabel = siteGenerator.getWeekLabel();
  const html = siteGenerator.generateHTML(planWithRecipes, groceryList, nutritionSummary, weekLabel);
  console.log(`✓ HTML generated for ${weekLabel}`);

  // Step 6: Save files
  console.log('\n[Step 6] Saving files...');
  const outputDir = path.join(__dirname, config.output.weeklyDir, weekLabel);
  const htmlPath = path.join(outputDir, 'index.html');
  const jsonPath = path.join(outputDir, 'recipes.json');

  siteGenerator.saveHTML(html, htmlPath);
  siteGenerator.saveRecipesJSON(planWithRecipes, jsonPath);

  console.log(`✓ Saved ${weekLabel}/index.html`);
  console.log(`✓ Saved ${weekLabel}/recipes.json`);

  // Step 7: Publish to GitHub
  console.log('\n[Step 7] Publishing to GitHub...');
  const publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);

  if (publishResult.success) {
    console.log(`✓ Published to GitHub successfully`);
    console.log(`  Commit: ${publishResult.commitHash}`);
  } else {
    console.log(`✗ GitHub publish failed: ${publishResult.error}`);
  }

  // Step 8: Verify ingredients are real
  console.log('\n[Step 8] Ingredient Quality Check...');
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

  console.log(`✓ Meals with real ingredients: ${hasRealIngredients}`);
  console.log(`✓ Meals with placeholder ingredients: ${hasFallbackIngredients}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('PIPELINE COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success!`);
  console.log(`\nSummary:`);
  console.log(`  Menu: ${Object.keys(weeklyPlan).length} days × 3 meals = ${Object.keys(weeklyPlan).length * 3} meals`);
  console.log(`  Recipes: ${realCount} real web_search, ${fallbackCount} fallback templates`);
  console.log(`  Grocery list: ${categories.length} categories, ${totalItems} items`);
  console.log(`  Ingredients: ${hasRealIngredients} meals with real ingredients, ${hasFallbackIngredients} with placeholders`);
  console.log(`  GitHub: ${publishResult.success ? '✓ Published' : '✗ Failed'}`);
  console.log(`  HTML: ${htmlPath}`);
  console.log(`  Week: ${weekLabel}`);
  console.log('\n' + '='.repeat(60));

  return {
    success: true,
    totalDays: Object.keys(weeklyPlan).length,
    totalMeals: Object.keys(weeklyPlan).length * 3,
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

// Run the pipeline
completePipeline()
  .then(result => {
    console.log('\n✅ Pipeline completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Pipeline failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
