/**
 * Chef Reviewer Agent - Common sense pass on weekly menu before grocery list generation
 * Reviews menu for practicality and balance
 */

// Simple and fancy meal lists for comparison
const SIMPLE_MEALS = [
  'Buckwheat porridge with milk and berries',
  'Oatmeal with honey and nuts',
  'Fried eggs with bread',
  'Kasha with butter and milk',
  'Scrambled eggs with vegetables',
  'Apple slices with cheese',
  'Yogurt with honey',
  'Nuts and dried fruits',
  'Cottage cheese with herbs',
  'Banana with peanut butter',
  'Pickled vegetables',
  'Ryebread with butter',
  'Edamame with sea salt',
  'Seaweed snacks',
  'Rice crackers',
  'Pickled ginger and daikon',
  'Mango slices',
  'Green tea cookies',
  'Fried tofu cubes',
  'Chicken soup with vegetables',
  'Borscht with sour cream',
  'Pelmeni with sour cream',
  'Chicken teriyaki with rice',
  'Rice noodles with egg',
  'Dim sum dumplings'
];

const FANCY_MEALS = [
  'Syrniki (cottage cheese pancakes)',
  'Blini with cheese filling',
  'Steamed buns with pork',
  'Rice porridge with pickles',
  'Congee with egg and scallions',
  'Miso soup with tofu',
  'Fried rice with vegetables',
  'Beef stroganoff with rice',
  'Shashlik (grilled meat) with salad',
  'Pasta carbonara',
  'Cabbage rolls with meat',
  'Pad Thai with shrimp',
  'Vietnamese pho',
  'Korean bibimbap',
  'Sichuan mapo tofu',
  'Thai green curry',
  'Japanese ramen'
];

// Main ingredient extraction keywords
const MAIN_INGREDIENTS = [
  'chicken', 'beef', 'pork', 'fish', 'shrimp', 'tofu', 'egg', 'cheese',
  'potato', 'rice', 'noodle', 'pasta', 'buckwheat', 'oat', 'kasha'
];

/**
 * Check if a meal is considered "fancy"
 * @param {string} mealName - Name of the meal
 * @returns {boolean} True if fancy
 */
function isFancyMeal(mealName) {
  const lower = mealName.toLowerCase();
  return FANCY_MEALS.some(meal => meal.toLowerCase() === lower);
}

/**
 * Extract main ingredient from meal name
 * @param {string} mealName - Name of the meal
 * @returns {string} Main ingredient or null
 */
function extractMainIngredient(mealName) {
  const lower = mealName.toLowerCase();
  for (const ingredient of MAIN_INGREDIENTS) {
    if (lower.includes(ingredient)) {
      return ingredient;
    }
  }
  return null;
}

/**
 * Check if a recipe is practical (<= 10 steps, no specialty equipment)
 * @param {Object} recipe - Recipe object
 * @returns {boolean} True if practical
 */
function isRecipePractical(recipe) {
  // Check number of steps
  const steps = recipe.instructions || [];
  if (steps.length > 10) {
    return false;
  }

  // Check for specialty equipment in instructions
  const specialEquipment = [
    'wok', 'bamboo steamer', 'food processor', 'stand mixer',
    'pressure cooker', 'instant pot', 'deep fryer', 'mandoline',
    'sous vide', 'blowtorch', 'smoker'
  ];

  const instructionsText = steps.join(' ').toLowerCase();
  for (const equipment of specialEquipment) {
    if (instructionsText.includes(equipment)) {
      return false;
    }
  }

  return true;
}

/**
 * Review weekly menu for balance and practicality
 * @param {Object} weeklyPlan - Weekly meal plan from menu-generator
 * @returns {Object} Review result with optimized menu
 */
function reviewMenu(weeklyPlan) {
  console.log('\n👨‍🍳 Chef Reviewer: Analyzing menu...\n');

  const result = {
    issues: [],
    suggestions: [],
    modified: false,
    optimizedMenu: JSON.parse(JSON.stringify(weeklyPlan))
  };

  // Check 1: Fancy meal overload (dinners only)
  const dinnerDays = Object.keys(weeklyPlan);
  const fancyDinnerCount = dinnerDays.filter(day => 
    isFancyMeal(weeklyPlan[day].dinner.name)
  ).length;

  if (fancyDinnerCount >= 5) {
    const issue = `${fancyDinnerCount}/7 dinners are fancy - may be too time-consuming`;
    result.issues.push(issue);
    result.suggestions.push(`Consider swapping ${fancyDinnerCount - 4} fancy dinners with simpler options`);

    // Try to swap fancy dinners with simple ones from same cuisine
    let swapsMade = 0;
    for (const day of dinnerDays) {
      if (swapsMade >= fancyDinnerCount - 4) break;

      const dinner = weeklyPlan[day].dinner;
      if (isFancyMeal(dinner.name)) {
        const cuisine = dinner.cuisine;
        // Find a simple meal from same cuisine
        const simpleOption = SIMPLE_MEALS.find(m => {
          const lower = m.toLowerCase();
          // This is a simple heuristic - in practice, you'd need proper cuisine categorization
          return !isFancyMeal(m) && (
            (cuisine === 'slavic' && (lower.includes('chicken') || lower.includes('soup') || lower.includes('egg'))) ||
            (cuisine === 'asian' && (lower.includes('noodle') || lower.includes('rice')))
          );
        });

        if (simpleOption) {
          result.optimizedMenu[day].dinner.name = simpleOption;
          result.modified = true;
          swapsMade++;
          result.suggestions.push(`  → Swapped "${dinner.name}" with "${simpleOption}" on ${day}`);
        }
      }
    }
  } else {
    console.log(`✓ Fancy dinner count: ${fancyDinnerCount}/7 (acceptable)`);
  }

  // Check 2: Cuisine balance (should be ~60% Slavic / 40% Asian)
  let slavicCount = 0;
  let asianCount = 0;

  for (const [day, meals] of Object.entries(weeklyPlan)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      if (mealData.cuisine === 'slavic') slavicCount++;
      else if (mealData.cuisine === 'asian') asianCount++;
    }
  }

  const totalMeals = slavicCount + asianCount;
  const slavicPercent = (slavicCount / totalMeals * 100).toFixed(0);
  const asianPercent = (asianCount / totalMeals * 100).toFixed(0);

  if (slavicPercent < 50 || slavicPercent > 70) {
    const issue = `Cuisine balance: ${slavicPercent}% Slavic / ${asianPercent}% Asian (target: 60/40)`;
    result.issues.push(issue);
    result.suggestions.push('Cuisine balance is slightly off, but acceptable');
  } else {
    console.log(`✓ Cuisine balance: ${slavicPercent}% Slavic / ${asianPercent}% Asian`);
  }

  // Check 3: Variety check - no duplicate main ingredients in consecutive days
  const days = Object.keys(weeklyPlan).sort();
  let consecutiveIssues = 0;

  for (let i = 0; i < days.length - 1; i++) {
    const day1 = days[i];
    const day2 = days[i + 1];

    const main1 = extractMainIngredient(weeklyPlan[day1].dinner.name);
    const main2 = extractMainIngredient(weeklyPlan[day2].dinner.name);

    if (main1 && main2 && main1 === main2) {
      consecutiveIssues++;
      result.issues.push(`Consecutive days (${day1} → ${day2}): both use ${main1}`);
      result.suggestions.push(`  → Consider varying the main protein`);
    }
  }

  if (consecutiveIssues === 0) {
    console.log(`✓ No duplicate main ingredients in consecutive days`);
  }

  // Check 4: Practicality flag (recipes with >10 steps or specialty equipment)
  let impracticalCount = 0;

  for (const [day, meals] of Object.entries(weeklyPlan)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      if (mealData.recipe && !isRecipePractical(mealData.recipe)) {
        impracticalCount++;
        const steps = mealData.recipe.instructions?.length || 0;
        result.issues.push(`${day} ${mealType}: "${mealData.name}" has ${steps} steps`);
        result.suggestions.push(`  → This may require significant time investment`);
      }
    }
  }

  if (impracticalCount === 0) {
    console.log(`✓ All meals appear practical`);
  }

  // Summary
  if (result.issues.length === 0) {
    console.log('✓ Menu looks good - no changes needed\n');
    result.modified = false;
  } else {
    console.log(`⚠️  Found ${result.issues.length} issue(s):`);
    result.issues.forEach(issue => console.log(`  - ${issue}`));
    if (result.suggestions.length > 0) {
      console.log('\nSuggestions:');
      result.suggestions.forEach(suggestion => console.log(`  ${suggestion}`));
    }
    console.log();
  }

  return result;
}

/**
 * Get meal suggestions from cache
 * @param {string} cuisine - 'slavic' or 'asian'
 * @param {string} mealType - 'breakfast', 'snack', or 'dinner'
 * @param {boolean} preferSimple - If true, prefer simple meals
 * @returns {string} Meal name
 */
function getSuggestion(cuisine, mealType, preferSimple = false) {
  const pool = preferSimple ? SIMPLE_MEALS : FANCY_MEALS.concat(SIMPLE_MEALS);

  // Filter by cuisine (simple heuristic)
  const filtered = pool.filter(meal => {
    const lower = meal.toLowerCase();
    if (cuisine === 'slavic') {
      return !lower.includes('teriyaki') && !lower.includes('pad thai') &&
             !lower.includes('pho') && !lower.includes('bibimbap') &&
             !lower.includes('mapo') && !lower.includes('curry') &&
             !lower.includes('ramen') && !lower.includes('congee') &&
             !lower.includes('steamed buns') && !lower.includes('dim sum');
    } else if (cuisine === 'asian') {
      return lower.includes('teriyaki') || lower.includes('pad thai') ||
             lower.includes('pho') || lower.includes('bibimbap') ||
             lower.includes('mapo') || lower.includes('curry') ||
             lower.includes('ramen') || lower.includes('congee') ||
             lower.includes('steamed buns') || lower.includes('dim sum') ||
             lower.includes('tofu') || lower.includes('edamame') ||
             lower.includes('noodle');
    }
    return true;
  });

  return filtered[Math.floor(Math.random() * filtered.length)] || SIMPLE_MEALS[0];
}

module.exports = {
  reviewMenu,
  isFancyMeal,
  extractMainIngredient,
  isRecipePractical,
  getSuggestion,
  SIMPLE_MEALS,
  FANCY_MEALS
};
