/**
 * Run Full Weekly Menu Pipeline
 * This script will be executed by the agent with access to web_search
 */

const fs = require('fs');
const path = require('path');

// Import modules
const menuGenerator = require('./src/menu-generator');
const recipeResearcher = require('./src/recipe-researcher');
const chefReviewer = require('./src/chef-reviewer');
const pantryNormalizer = require('./src/pantry-normalizer');
const groceryListBuilder = require('./src/grocery-list-builder');
const pantryManagerEnhanced = require('./src/pantry-manager-enhanced');
const siteGenerator = require('./src/site-generator');
const publisher = require('./src/publisher');

// Load config
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// This will be provided by the OpenClaw environment
const webSearch = typeof web_search !== 'undefined' ? web_search : null;

async function runPipeline() {
  console.log('='.repeat(60));
  console.log('WEEKLY MENU GENERATOR - FULL PIPELINE');
  console.log('='.repeat(60));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Config: ${config.nutrition} nutrition, ${config.cuisine.slavicRatio*100}% Slavic, ${config.cuisine.asianRatio*100}% Asian`);
  console.log('='.repeat(60));

  try {
    // Step 1: Generate Menu
    console.log('\n📅 STEP 1: Generating weekly menu...');
    const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);
    const totalMeals = Object.values(weeklyPlan).reduce((sum, day) => sum + Object.keys(day).length, 0);
    console.log(`✓ Generated ${totalMeals} meals across ${Object.keys(weeklyPlan).length} days`);
    
    // Save menu
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outputDir, 'menu.json'), JSON.stringify(weeklyPlan, null, 2));
    console.log(`✓ Saved menu to output/menu.json`);

    // Step 2: Research Recipes
    console.log('\n🔍 STEP 2: Researching recipes with web_search...');
    if (!webSearch) {
      throw new Error('web_search tool not available!');
    }
    
    const planWithRecipes = await recipeResearcher.researchRecipes(weeklyPlan, webSearch);
    console.log('✓ All recipes researched and attached');
    
    // Save recipes
    fs.writeFileSync(path.join(outputDir, 'recipes-data.json'), JSON.stringify(planWithRecipes, null, 2));
    console.log(`✓ Saved recipes to output/recipes-data.json`);

    // Step 3: Chef Review
    console.log('\n👨‍🍳 STEP 3: Chef reviewing menu...');
    const chefReview = chefReviewer.reviewMenu(planWithRecipes);
    let finalPlan = chefReview.modified ? chefReview.optimizedMenu : planWithRecipes;
    console.log(chefReview.modified ? '✓ Menu optimized by chef' : '✓ Menu approved by chef');

    // Step 4: Normalize Ingredients
    console.log('\n🧹 STEP 4: Normalizing ingredients...');
    const normalizedPlan = pantryNormalizer.normalizeWeeklyPlan(finalPlan);
    console.log('✓ Ingredients normalized (prep methods removed, duplicates merged)');

    // Step 5: Build Grocery List
    console.log('\n🛒 STEP 5: Building grocery list...');
    const groceryList = groceryListBuilder.buildGroceryList(normalizedPlan);
    const totalItems = Object.values(groceryList).reduce((sum, items) => sum + items.length, 0);
    console.log(`✓ Built grocery list with ${totalItems} items`);

    // Step 6: Generate Pantry
    console.log('\n🏠 STEP 6: Generating virtual pantry...');
    const pantryData = pantryManagerEnhanced.generatePantryFromGroceryList(groceryList, normalizedPlan);
    console.log(`✓ Virtual pantry created with ${pantryData.summary.totalItems} items`);

    // Step 7: Generate HTML
    console.log('\n🌐 STEP 7: Generating HTML site...');
    const weekLabel = siteGenerator.getWeekLabel();
    const html = siteGenerator.generateHTML(normalizedPlan, groceryList, pantryData.pantry, weekLabel);
    console.log(`✓ HTML generated for week: ${weekLabel}`);

    // Step 8: Save files
    console.log('\n💾 STEP 8: Saving files...');
    const weekDir = path.join(outputDir, 'weekly', weekLabel);
    if (!fs.existsSync(weekDir)) {
      fs.mkdirSync(weekDir, { recursive: true });
    }
    
    const htmlPath = path.join(weekDir, 'index.html');
    const jsonPath = path.join(weekDir, 'recipes.json');
    const pantryPath = path.join(weekDir, 'pantry.json');
    
    fs.writeFileSync(htmlPath, html);
    fs.writeFileSync(jsonPath, JSON.stringify(normalizedPlan, null, 2));
    fs.writeFileSync(pantryPath, JSON.stringify(pantryData, null, 2));
    
    console.log(`✓ Saved HTML: ${htmlPath}`);
    console.log(`✓ Saved JSON: ${jsonPath}`);
    console.log(`✓ Saved Pantry: ${pantryPath}`);

    // Step 9: Publish to GitHub
    console.log('\n📤 STEP 9: Publishing to GitHub...');
    const publishResult = await publisher.publishToGitHub(htmlPath, weekLabel);
    
    if (publishResult.success) {
      console.log('✓ Published to GitHub successfully');
      console.log(`  Repository: ${config.github.repo}`);
      console.log(`  Branch: ${config.github.branch}`);
    } else {
      console.error('✗ Publishing failed:', publishResult.error);
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ PIPELINE COMPLETE');
    console.log('='.repeat(60));
    console.log(`Week: ${weekLabel}`);
    console.log(`Total meals: ${totalMeals}`);
    console.log(`Grocery items: ${totalItems}`);
    console.log(`Pantry items: ${pantryData.summary.totalItems}`);
    console.log(`Published: ${publishResult.success ? 'Yes' : 'No'}`);
    console.log(`GitHub URL: https://stasik5.github.io/weekly-menu/`);
    console.log('='.repeat(60));

    return {
      success: true,
      weekLabel,
      totalMeals,
      totalItems,
      pantryItems: pantryData.summary.totalItems,
      publishResult,
      weeklyPlan: normalizedPlan,
      groceryList,
      pantryData
    };

  } catch (error) {
    console.error('\n❌ PIPELINE ERROR:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run pipeline
runPipeline()
  .then(result => {
    console.log('\n✅ Pipeline completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Pipeline failed:', error.message);
    process.exit(1);
  });
