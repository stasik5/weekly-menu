/**
 * Test the web_search integration with mock data
 */

const fs = require('fs');
const path = require('path');
const recipeFetcher = require('./src/recipe-fetcher');
const menuGenerator = require('./src/menu-generator');

// Mock search results
const mockSearchResults = {
  'Fried eggs with bread': [
    {
      title: 'Classic Fried Eggs with Toast - Easy Breakfast Recipe',
      url: 'https://example.com/fried-eggs',
      snippet: 'Ingredients: 2 large eggs, 2 slices of bread, butter, salt, pepper. Instructions: Heat butter in pan, crack eggs, cook until whites set, season with salt and pepper, serve with toast. Nutrition: 220 calories, 12g protein, 1g carbs, 18g fat.'
    }
  ],
  'Pad Thai with shrimp': [
    {
      title: 'Authentic Pad Thai with Shrimp - Thai Street Food Recipe',
      url: 'https://example.com/pad-thai',
      snippet: 'Ingredients: rice noodles, shrimp, eggs, bean sprouts, peanuts, tamarind paste, fish sauce. Instructions: Soak noodles, stir-fry shrimp, add eggs, add noodles and sauce, toss with bean sprouts, top with peanuts. Nutrition: 450 calories, 25g protein, 50g carbs, 18g fat.'
    }
  ],
  'Borscht with sour cream': [
    {
      title: 'Traditional Ukrainian Borscht Recipe',
      url: 'https://example.com/borscht',
      snippet: 'Ingredients: beets, cabbage, potatoes, carrots, onions, beef broth, sour cream. Instructions: Sauté vegetables, add broth and simmer, blend half for texture, serve with sour cream. Nutrition: 180 calories, 8g protein, 22g carbs, 7g fat.'
    }
  ]
};

/**
 * Mock web_search function
 */
async function mockWebSearch({ query, count }) {
  console.log(`  [MOCK] Searching: ${query}`);

  // Find matching meal name
  for (const [mealName, results] of Object.entries(mockSearchResults)) {
    if (query.toLowerCase().includes(mealName.toLowerCase())) {
      console.log(`  [MOCK] Found results for: ${mealName}`);
      return results;
    }
  }

  // Return empty for unknown meals
  console.log(`  [MOCK] No results for query`);
  return [];
}

/**
 * Test the recipe research integration
 */
async function testIntegration() {
  console.log('='.repeat(50));
  console.log('Testing web_search Integration');
  console.log('='.repeat(50));

  try {
    // Step 1: Generate menu
    console.log('\n1. Generating menu plan...');
    const weeklyPlan = menuGenerator.generateWeeklyMenu('medium');
    console.log(`✓ Generated menu for ${menuGenerator.DAYS.length} days`);

    // Step 2: Save menu
    const outputDir = path.join(__dirname, 'output');
    const menuJsonPath = path.join(outputDir, 'test-menu.json');
    const recipesJsonPath = path.join(outputDir, 'test-recipes-data.json');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(menuJsonPath, JSON.stringify(weeklyPlan, null, 2), 'utf8');
    console.log(`✓ Saved menu to: ${menuJsonPath}`);

    // Step 3: Run recipe research with mock web_search
    console.log('\n2. Researching recipes with mock web_search...\n');
    const agentModule = require('./agent-research-recipes.js');

    // Temporarily replace web_search for the test
    const originalWebSearch = global.web_search;
    global.web_search = mockWebSearch;

    try {
      const recipesData = await agentModule.researchAllRecipes(weeklyPlan);
      console.log(`✓ Researched ${Object.keys(recipesData).length} recipes`);

      // Save results
      fs.writeFileSync(recipesJsonPath, JSON.stringify(recipesData, null, 2), 'utf8');
      console.log(`✓ Saved recipes to: ${recipesJsonPath}`);
    } finally {
      // Restore original web_search
      global.web_search = originalWebSearch;
    }

    // Step 4: Load and attach recipes
    console.log('\n3. Attaching recipes to meals...\n');
    const loadedRecipes = recipeFetcher.loadRecipesFromJSON(recipesJsonPath);
    const planWithRecipes = recipeFetcher.attachRecipesToMeals(weeklyPlan, loadedRecipes);

    // Step 5: Verify results
    console.log('\n4. Verifying results...\n');

    let webSearchCount = 0;
    let fallbackCount = 0;

    for (const [day, meals] of Object.entries(planWithRecipes)) {
      for (const [mealType, mealData] of Object.entries(meals)) {
        const source = mealData.recipe?.source || 'unknown';
        if (source === 'web_search') {
          webSearchCount++;
          console.log(`✓ ${day} ${mealType}: "${mealData.name}" - ${source}`);
        } else {
          fallbackCount++;
          console.log(`○ ${day} ${mealType}: "${mealData.name}" - ${source}`);
        }
      }
    }

    console.log(`\nSummary:`);
    console.log(`  Web search results: ${webSearchCount}`);
    console.log(`  Fallback results: ${fallbackCount}`);

    // Check if mock results were used
    if (webSearchCount > 0) {
      console.log(`\n✅ SUCCESS! Mock web_search integration works!`);
      console.log(`   ${webSearchCount} recipes found via mock web_search`);
    } else {
      console.log(`\n⚠️ WARNING: No web_search results found`);
      console.log(`   All ${fallbackCount} recipes used fallback`);
    }

    return { webSearchCount, fallbackCount };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run test
if (require.main === module) {
  testIntegration()
    .then(result => {
      console.log('\n✅ Test completed');
      process.exit(result.webSearchCount > 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test failed');
      process.exit(1);
    });
}

module.exports = { testIntegration, mockWebSearch };
