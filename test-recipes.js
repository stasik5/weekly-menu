/**
 * Test script for Phase 3 - Recipe Research with web_search
 */

const recipeResearcher = require('./src/recipe-researcher');
const menuGenerator = require('./src/menu-generator');

// Mock web_search wrapper for the test
async function test_web_search({ query, count }) {
  console.log(`  [web_search] Query: "${query}"`);

  // In the actual OpenClaw environment, this would call the real web_search tool
  // For testing, we'll simulate responses for common meals
  const mockResults = {
    'asian chicken stir fry recipe ingredients instructions': [
      {
        title: 'Asian Chicken Stir Fry - Easy 20 Minute Recipe',
        url: 'https://example.com/asian-stir-fry',
        snippet: 'Ingredients: 2 chicken breasts sliced, 2 cups mixed vegetables, 3 tbsp soy sauce, 1 tbsp sesame oil, 2 cloves garlic minced, 1 inch ginger grated. Instructions: Heat oil in wok, add chicken, cook 5 mins. Add vegetables, stir fry 3 mins. Add garlic and ginger, cook 1 min. Add soy sauce, toss to coat. Serve over rice.'
      }
    ],
    'slavic potato dumpling recipe ingredients instructions': [
      {
        title: 'Traditional Slavic Potato Dumplings (Pierogi)',
        url: 'https://example.com/slavic-dumplings',
        snippet: 'Ingredients: 4 large potatoes peeled, 2 cups all-purpose flour, 1 egg, 1/2 cup sour cream, 1 tbsp butter. Instructions: Boil potatoes until tender, mash and let cool. Mix flour, egg, sour cream. Combine with potatoes to form dough. Roll out and cut circles. Fill with potato filling. Boil 3-4 minutes until they float. Serve with sour cream.'
      }
    ],
    'italian pasta carbonara recipe ingredients instructions': [
      {
        title: 'Classic Italian Pasta Carbonara',
        url: 'https://example.com/carbonara',
        snippet: 'Ingredients: 400g spaghetti, 200g pancetta, 4 egg yolks, 100g pecorino cheese, black pepper. Instructions: Cook pasta in salted water. Fry pancetta until crispy. Whisk egg yolks with cheese. Combine hot pasta with pancetta, remove from heat, add egg mixture and toss quickly. Season with pepper. Serve immediately.'
      }
    ]
  };

  // Find matching result or return empty
  const key = Object.keys(mockResults).find(k => query.toLowerCase().includes(k.toLowerCase().split(' ')[0]));

  if (key) {
    console.log(`  [web_search] Found ${mockResults[key].length} results`);
    return mockResults[key];
  }

  console.log(`  [web_search] No mock results for "${query}"`);
  return [];
}

async function testRecipeResearch() {
  console.log('='.repeat(50));
  console.log('Testing Recipe Research with web_search');
  console.log('='.repeat(50));

  try {
    // Generate a small test menu (just 2 days)
    const config = {
      nutrition: 'moderate',
      targetCalories: {
        breakfast: 400,
        snack: 200,
        dinner: 800
      }
    };

    console.log('\nGenerating test menu (2 days)...');
    const weeklyPlan = menuGenerator.generateWeeklyMenu(config.nutrition);

    // Limit to 2 days for testing
    const testPlan = {
      Monday: weeklyPlan.Monday,
      Tuesday: weeklyPlan.Tuesday
    };

    console.log('\nTest meals:');
    for (const [day, meals] of Object.entries(testPlan)) {
      for (const [mealType, meal] of Object.entries(meals)) {
        console.log(`  ${day} ${mealType}: ${meal.name} (${meal.cuisine})`);
      }
    }

    console.log('\n🔍 Starting recipe research...\n');

    // Research recipes using web_search
    const planWithRecipes = await recipeResearcher.researchRecipes(testPlan, test_web_search);

    console.log('\n' + '='.repeat(50));
    console.log('Recipes Found:');
    console.log('='.repeat(50));

    // Display results
    for (const [day, meals] of Object.entries(planWithRecipes)) {
      console.log(`\n${day}:`);

      for (const [mealType, mealData] of Object.entries(meals)) {
        const recipe = mealData.recipe;

        console.log(`  ${mealType}: ${recipe.title}`);
        console.log(`    Source: ${recipe.source}`);
        console.log(`    Ingredients: ${recipe.ingredients.length} items`);

        if (recipe.ingredients.length > 0 && recipe.ingredients[0] !== 'Main ingredients vary by recipe') {
          console.log('    Sample ingredients:');
          recipe.ingredients.slice(0, 3).forEach(ing => {
            console.log(`      - ${ing}`);
          });
        }

        console.log(`    Instructions: ${recipe.instructions.length} steps`);

        if (recipe.instructions.length > 0 && recipe.instructions[0] !== 'Prepare ingredients according to standard cooking methods') {
          console.log('    Sample instruction:');
          console.log(`      ${recipe.instructions[0]}`);
        }

        console.log(`    Nutrition: ${recipe.nutrition.calories} kcal, ${recipe.nutrition.protein}g protein, ${recipe.nutrition.carbs}g carbs, ${recipe.nutrition.fat}g fat`);

        if (recipe.url) {
          console.log(`    URL: ${recipe.url}`);
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test Complete!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testRecipeResearch();
