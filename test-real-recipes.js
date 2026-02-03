/**
 * Real test script for Phase 3 - Recipe Research with actual web_search
 */

const recipeResearcher = require('./src/recipe-researcher');
const menuGenerator = require('./src/menu-generator');

// Test with a few specific meals that should have real recipes
const testMeals = [
  {
    day: 'Monday',
    mealType: 'dinner',
    name: 'Chicken stir fry',
    cuisine: 'asian',
    targetCalories: 800
  },
  {
    day: 'Monday',
    mealType: 'snack',
    name: 'Fruit smoothie',
    cuisine: 'international',
    targetCalories: 200
  },
  {
    day: 'Tuesday',
    mealType: 'dinner',
    name: 'Beef stew',
    cuisine: 'slavic',
    targetCalories: 800
  }
];

// This will be called by the actual web_search tool
// We'll call it directly from within this function
async function testWithRealWebSearch() {
  console.log('='.repeat(50));
  console.log('Testing Real Recipe Research');
  console.log('='.repeat(50));

  const results = [];

  for (const meal of testMeals) {
    console.log(`\n${meal.day} ${meal.mealType}: ${meal.name} (${meal.cuisine})`);

    const query = recipeResearcher.buildSearchQuery(meal.name, meal.cuisine);
    console.log(`  Query: "${query}"`);

    try {
      // Call the actual web_search tool using the built-in function
      const searchResults = await web_search({
        query: query,
        count: 2
      });

      console.log(`  Found ${searchResults.length} results`);

      // Parse the first result
      const recipe = recipeResearcher.parseRecipeFromSearch(
        meal.name,
        meal.mealType,
        meal.targetCalories,
        searchResults
      );

      console.log(`  Recipe: ${recipe.title}`);
      console.log(`  Ingredients: ${recipe.ingredients.length}`);
      console.log(`  Instructions: ${recipe.instructions.length}`);
      console.log(`  Nutrition: ${recipe.nutrition.calories} kcal`);

      if (recipe.ingredients.length > 0 && !recipe.ingredients[0].includes('vary by recipe')) {
        console.log(`  Sample ingredient: ${recipe.ingredients[0]}`);
      }

      if (recipe.instructions.length > 0 && !recipe.instructions[0].includes('standard cooking methods')) {
        console.log(`  Sample instruction: ${recipe.instructions[0].substring(0, 60)}...`);
      }

      results.push({
        meal: meal,
        recipe: recipe,
        success: true
      });

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      results.push({
        meal: meal,
        recipe: recipeResearcher.createFallbackRecipe(meal.name, meal.mealType, meal.targetCalories),
        success: false,
        error: error.message
      });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log('='.repeat(50));
  const successful = results.filter(r => r.success).length;
  console.log(`Successfully found recipes: ${successful}/${results.length}`);

  return results;
}

testWithRealWebSearch()
  .then(results => {
    console.log('\n✅ Test Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
