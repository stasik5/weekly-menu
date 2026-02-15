/**
 * Complete Weekly Menu Pipeline Runner
 * Merges cached recipes with new searches and runs full pipeline
 */

const fs = require('fs');
const path = require('path');

// Load all modules
const chefReviewer = require('./src/chef-reviewer');
const pantryNormalizer = require('./src/pantry-normalizer');
const groceryListBuilder = require('./src/grocery-list-builder');
const pantryManagerEnhanced = require('./src/pantry-manager-enhanced');
const siteGenerator = require('./src/site-generator');
const publisher = require('./src/publisher');

// Load files
const menu = JSON.parse(fs.readFileSync('./output/menu.json', 'utf8'));
const cachedRecipes = JSON.parse(fs.readFileSync('./output/recipes-data.json', 'utf8'));
const newRecipes = JSON.parse(fs.readFileSync('./output/recipes-search-results.json', 'utf8'));

// Merge recipes
const allRecipes = { ...cachedRecipes, ...newRecipes };
console.log(`✓ Merged recipes: ${Object.keys(cachedRecipes).length} cached + ${Object.keys(newRecipes).length} new = ${Object.keys(allRecipes).length} total`);

// Attach recipes to menu
console.log('\n📎 Attaching recipes to menu...');
const planWithRecipes = JSON.parse(JSON.stringify(menu));
let recipesUsed = 0;
let fallbackUsed = 0;

for (const [day, meals] of Object.entries(planWithRecipes)) {
  for (const [mealType, mealData] of Object.entries(meals)) {
    const recipe = allRecipes[mealData.name];
    if (recipe) {
      planWithRecipes[day][mealType].recipe = recipe;
      recipesUsed++;
    } else {
      // Create fallback if recipe not found
      planWithRecipes[day][mealType].recipe = {
        title: mealData.name,
        cuisine: mealData.cuisine,
        ingredients: ['Ingredients vary by recipe'],
        instructions: ['Cook according to recipe instructions'],
        nutrition: {
          calories: mealData.targetCalories,
          protein: Math.round(mealData.targetCalories * 0.2 / 4),
          carbs: Math.round(mealData.targetCalories * 0.35 / 4),
          fat: Math.round(mealData.targetCalories * 0.45 / 9)
        },
        source: 'fallback',
        url: null
      };
      fallbackUsed++;
      console.log(`  ⚠️ Fallback for: ${mealData.name}`);
    }
  }
}

console.log(`✓ Recipes attached: ${recipesUsed} from cache/search, ${fallbackUsed} fallbacks\n`);

// Save merged recipes
fs.writeFileSync('./output/recipes-data-merged.json', JSON.stringify(allRecipes, null, 2));
console.log('✓ Saved merged recipes to output/recipes-data-merged.json\n');

// Continue with pipeline
async function runPipeline() {
  try {
    // Step 3: Chef Review
    console.log('👨‍🍳 STEP 3: Chef reviewing menu...');
    const chefReview = chefReviewer.reviewMenu(planWithRecipes);
    let finalPlan = chefReview.modified ? chefReview.optimizedMenu : planWithRecipes;
    console.log(chefReview.modified ? '✓ Menu optimized by chef' : '✓ Menu approved by chef (no changes needed)\n');

    // Step 4: Normalize Ingredients
    console.log('🧹 STEP 4: Normalizing ingredients...');
    const normalizedPlan = pantryNormalizer.normalizeWeeklyPlan(finalPlan);
    console.log('✓ Ingredients normalized (prep methods removed, duplicates merged)\n');

    // Step 5: Build Grocery List
    console.log('🛒 STEP 5: Building grocery list...');
    const groceryList = groceryListBuilder.buildGroceryList(normalizedPlan);
    const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
    console.log(`✓ Built grocery list with ${totalItems} items\n`);

    // Step 6: Generate Pantry
    console.log('🏠 STEP 6: Generating virtual pantry...');
    const pantryData = pantryManagerEnhanced.generatePantryFromGroceryList(groceryList, normalizedPlan);
    console.log(`✓ Virtual pantry created with ${pantryData.summary.totalItems} items\n`);

    // Flatten categorized pantry for formatPantryDisplay (which expects simple key-value structure)
    const flatPantry = {};
    for (const [category, items] of Object.entries(pantryData.categorized)) {
      for (const [key, item] of Object.entries(items)) {
        // Convert quantity string to numeric values for display
        const qtyMatch = item.quantity?.match(/^([\d.]+)/);
        const totalValue = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
        flatPantry[key] = {
          emoji: item.emoji,
          name: item.name,
          normalizedName: key,
          total: totalValue,
          unit: item.quantity?.replace(/^[\d.]+\s*/, '') || '',
          remaining: totalValue, // Show full amount (shopping list, not inventory)
          dailyUsage: (item.usedIn || []).map(u => ({
            day: u.day,
            mealType: u.mealType,
            meal: u.cuisine || ''
          }))
        };
      }
    }

    // Step 7: Generate HTML
    console.log('🌐 STEP 7: Generating HTML site...');
    const weekLabel = siteGenerator.getWeekLabel();
    const html = siteGenerator.generateHTML(normalizedPlan, groceryList, flatPantry, weekLabel);
    console.log(`✓ HTML generated for week: ${weekLabel}\n`);

    // Step 8: Save files
    console.log('💾 STEP 8: Saving files...');
    const outputDir = path.join(__dirname, 'output', 'weekly', weekLabel);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, 'index.html');
    const jsonPath = path.join(outputDir, 'recipes.json');
    const pantryPath = path.join(outputDir, 'pantry.json');

    fs.writeFileSync(htmlPath, html);
    fs.writeFileSync(jsonPath, JSON.stringify(normalizedPlan, null, 2));
    fs.writeFileSync(pantryPath, JSON.stringify(pantryData, null, 2));

    // Also copy to docs/ for GitHub Pages
    const docsPath = path.join(__dirname, 'docs', 'index.html');
    const docsDir = path.dirname(docsPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.copyFileSync(htmlPath, docsPath);

    console.log(`✓ Saved HTML: ${htmlPath}`);
    console.log(`✓ Saved JSON: ${jsonPath}`);
    console.log(`✓ Saved Pantry: ${pantryPath}`);
    console.log(`✓ Copied to docs: ${docsPath}\n`);

    // Step 9: Publish to GitHub
    console.log('📤 STEP 9: Publishing to GitHub...');
    const publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);

    if (publishResult.success) {
      console.log('✓ Published to GitHub successfully');
      console.log(`  Repository: stasik5/weekly-menu`);
      console.log(`  Branch: main\n`);
    } else {
      console.error('✗ Publishing failed:', publishResult.error, '\n');
    }

    // Summary
    console.log('='.repeat(60));
    console.log('✅ PIPELINE COMPLETE');
    console.log('='.repeat(60));
    console.log(`Week: ${weekLabel}`);
    console.log(`Total meals: 21`);
    console.log(`Grocery items: ${totalItems}`);
    console.log(`Pantry items: ${pantryData.summary.totalItems}`);
    console.log(`Published: ${publishResult.success ? 'Yes' : 'No'}`);
    console.log(`GitHub URL: https://stasik5.github.io/weekly-menu/`);
    console.log('='.repeat(60), '\n');

    return {
      success: true,
      weekLabel,
      totalItems,
      pantryItems: pantryData.summary.totalItems,
      publishResult,
      groceryList,
      pantryData
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run pipeline
runPipeline()
  .then(result => {
    // Save result for notification
    fs.writeFileSync('./output/pipeline-result.json', JSON.stringify(result, null, 2));
    console.log('✓ Pipeline result saved to output/pipeline-result.json\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Pipeline failed:', error.message);
    process.exit(1);
  });
