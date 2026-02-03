/**
 * Test script for Weekly Grocery Planner
 * Tests different nutrition levels and validates outputs
 */

const menuGenerator = require('./src/menu-generator');
const recipeResearcher = require('./src/recipe-researcher');
const nutrition = require('./src/nutrition');

/**
 * Attach fallback recipes to menu (for testing)
 */
function attachRecipesToMenu(menu) {
  const menuWithRecipes = JSON.parse(JSON.stringify(menu));

  for (const [day, meals] of Object.entries(menuWithRecipes)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      const fallbackRecipe = recipeResearcher.createFallbackRecipe(
        mealData.name,
        mealType,
        mealData.targetCalories
      );

      menuWithRecipes[day][mealType].recipe = fallbackRecipe;
    }
  }

  return menuWithRecipes;
}

console.log('='.repeat(60));
console.log('Weekly Grocery Planner - Test Suite');
console.log('='.repeat(60));

// Test 1: Menu generation for each nutrition level
console.log('\nTest 1: Menu Generation');
console.log('-'.repeat(60));

const levels = ['lower', 'medium', 'higher'];
for (const level of levels) {
  console.log(`\nTesting ${level} level:`);
  const menu = menuGenerator.generateWeeklyMenu(level);

  // Attach recipes (for testing)
  const menuWithRecipes = attachRecipesToMenu(menu);

  // Calculate nutrition
  const calculatedNutrition = nutrition.calculateNutrition(menuWithRecipes);
  const summary = nutrition.generateNutritionSummary(calculatedNutrition, level);

  console.log(`  Daily avg: ${summary.actual.daily.calories} kcal`);
  console.log(`  Target: ${summary.targets.daily.calories} kcal`);
  console.log(`  Protein: ${summary.actual.daily.protein}g / ${summary.targets.daily.protein}g`);
  console.log(`  Carbs: ${summary.actual.daily.carbs}g / ${summary.targets.daily.carbs}g`);
  console.log(`  Fat: ${summary.actual.daily.fat}g / ${summary.targets.daily.fat}g`);
  console.log(`  Within tolerance: ${summary.isValid ? '✅' : '❌'}`);

  if (!summary.isValid) {
    console.log(`  Flags: ${summary.validation.daily.flags.map(f => f.nutrient).join(', ')}`);
  }
}

// Test 2: Cuisine distribution
console.log('\n\nTest 2: Cuisine Distribution');
console.log('-'.repeat(60));

const testMenu = menuGenerator.generateWeeklyMenu('medium');
let slavicCount = 0;
let asianCount = 0;
const totalMeals = 21; // 7 days × 3 meals

for (const day of Object.values(testMenu)) {
  for (const meal of Object.values(day)) {
    if (meal.cuisine === 'slavic') slavicCount++;
    else if (meal.cuisine === 'asian') asianCount++;
  }
}

const slavicPercent = (slavicCount / totalMeals * 100).toFixed(1);
const asianPercent = (asianCount / totalMeals * 100).toFixed(1);

console.log(`Slavic meals: ${slavicCount}/${totalMeals} (${slavicPercent}%)`);
console.log(`Asian meals: ${asianCount}/${totalMeals} (${asianPercent}%)`);
console.log(`Expected: ~60% Slavic, ~40% Asian`);
console.log(`${Math.abs(slavicPercent - 60) < 15 ? '✅' : '⚠️'} Within expected range`);

// Test 3: Meal variety
console.log('\n\nTest 3: Meal Variety (No repeats per meal type)');
console.log('-'.repeat(60));

const breakfastMeals = new Set();
const snackMeals = new Set();
const dinnerMeals = new Set();

for (const day of Object.values(testMenu)) {
  breakfastMeals.add(day.breakfast.name);
  snackMeals.add(day.snack.name);
  dinnerMeals.add(day.dinner.name);
}

console.log(`Unique breakfasts: ${breakfastMeals.size}/7 (${breakfastMeals.size === 7 ? '✅' : '⚠️'})`);
console.log(`Unique snacks: ${snackMeals.size}/7 (${snackMeals.size === 7 ? '✅' : '⚠️'})`);
console.log(`Unique dinners: ${dinnerMeals.size}/7 (${dinnerMeals.size === 7 ? '✅' : '⚠️'})`);

// Test 4: Nutrition validation
console.log('\n\nTest 4: Nutrition Validation (20% tolerance)');
console.log('-'.repeat(60));

const mediumMenu = menuGenerator.generateWeeklyMenu('medium');
const mediumMenuWithRecipes = attachRecipesToMenu(mediumMenu);
const mediumNutrition = nutrition.calculateNutrition(mediumMenuWithRecipes);
const mediumSummary = nutrition.generateNutritionSummary(mediumNutrition, 'medium');

console.log(`Medium level validation: ${mediumSummary.isValid ? '✅ PASS' : '❌ FAIL'}`);

// Test each nutrient
const nutrients = ['calories', 'protein', 'carbs', 'fat'];
for (const nutrient of nutrients) {
  const result = mediumSummary.validation.daily.results[nutrient];
  const status = result.withinTolerance ? '✅' : '❌';
  console.log(`  ${nutrient}: ${result.actual} vs ${result.target} (${result.percentage}%) ${status}`);
}

console.log('\n' + '='.repeat(60));
console.log('Test Suite Complete');
console.log('='.repeat(60));
