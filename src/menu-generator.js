/**
 * Menu Generator - Creates weekly meal plans
 * Generates 7 days × 3 meals (breakfast, snack, dinner)
 * Alternates between Slavic/pasta (60%) and Asian (40%) cuisines
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'snack', 'dinner'];

// Meal templates with calorie targets and cuisine types
const MEAL_TEMPLATES = {
  // Slavic/Pasta meals (60% preference)
  slavic: {
    breakfast: [
      'Buckwheat porridge with milk and berries',
      'Oatmeal with honey and nuts',
      'Fried eggs with bread',
      'Syrniki (cottage cheese pancakes)',
      'Blini with cheese filling',
      'Kasha with butter and milk',
      'Scrambled eggs with vegetables'
    ],
    snack: [
      'Apple slices with cheese',
      'Yogurt with honey',
      'Nuts and dried fruits',
      'Cottage cheese with herbs',
      'Banana with peanut butter',
      'Pickled vegetables',
      'Ryebread with butter'
    ],
    dinner: [
      'Chicken soup with vegetables',
      'Borscht with sour cream',
      'Beef stroganoff with rice',
      'Pelmeni with sour cream',
      'Shashlik (grilled meat) with salad',
      'Pasta carbonara',
      'Cabbage rolls with meat'
    ]
  },
  // Asian meals (40% preference)
  asian: {
    breakfast: [
      'Congee with egg and scallions',
      'Steamed buns with pork',
      'Rice porridge with pickles',
      'Fried rice with vegetables',
      'Miso soup with tofu',
      'Rice noodles with egg',
      'Dim sum dumplings'
    ],
    snack: [
      'Edamame with sea salt',
      'Seaweed snacks',
      'Rice crackers',
      'Pickled ginger and daikon',
      'Mango slices',
      'Green tea cookies',
      'Fried tofu cubes'
    ],
    dinner: [
      'Chicken teriyaki with rice',
      'Pad Thai with shrimp',
      'Vietnamese pho',
      'Korean bibimbap',
      'Sichuan mapo tofu',
      'Thai green curry',
      'Japanese ramen'
    ]
  }
};

// Calorie targets per meal based on nutrition level (FOR 2 ADULTS)
// Targets: lower (3400), medium (4000), higher (4700)
// These match the nutrition.js NUTRITION_TARGETS daily values
const CALORIE_TARGETS = {
  lower: { breakfast: 1200, snack: 400, dinner: 1800 },   // 3400 total
  medium: { breakfast: 1400, snack: 500, dinner: 2100 },  // 4000 total
  higher: { breakfast: 1650, snack: 600, dinner: 2450 }   // 4700 total
};

/**
 * Generate a weekly meal plan
 * @param {string} nutritionLevel - 'lower', 'medium', or 'higher'
 * @returns {Object} Weekly meal plan with calories
 */
function generateWeeklyMenu(nutritionLevel = 'medium') {
  const weeklyPlan = {};
  const usedMeals = { breakfast: new Set(), snack: new Set(), dinner: new Set() };
  const cuisineCount = { slavic: 0, asian: 0 };
  const totalMeals = DAYS.length * MEAL_TYPES.length;

  // Target: ~60% slavic (12-13 meals), ~40% asian (8-9 meals)
  const targetSlavic = Math.round(totalMeals * 0.6); // 13 meals
  const targetAsian = totalMeals - targetSlavic;    // 8 meals

  DAYS.forEach(day => {
    weeklyPlan[day] = {};
    const calorieTarget = CALORIE_TARGETS[nutritionLevel] || CALORIE_TARGETS.medium;

    MEAL_TYPES.forEach(mealType => {
      // Determine cuisine type - track count and enforce closer to 60/40 split
      // Use dynamic probability based on remaining needed meals
      const remainingMeals = totalMeals - (cuisineCount.slavic + cuisineCount.asian);
      const remainingSlavicNeeded = targetSlavic - cuisineCount.slavic;
      const remainingAsianNeeded = targetAsian - cuisineCount.asian;

      let slavicProbability;
      if (remainingMeals === 0) {
        slavicProbability = 0.6;
      } else if (remainingSlavicNeeded <= 0) {
        slavicProbability = 0; // Already met slavic target, must pick asian
      } else if (remainingAsianNeeded <= 0) {
        slavicProbability = 1; // Already met asian target, must pick slavic
      } else {
        // Calculate probability to stay on track
        slavicProbability = remainingSlavicNeeded / remainingMeals;
      }

      const cuisine = Math.random() < slavicProbability ? 'slavic' : 'asian';
      cuisineCount[cuisine]++;

      const availableMeals = MEAL_TEMPLATES[cuisine][mealType].filter(m => !usedMeals[mealType].has(m));

      // If we've used all meals, reset and allow repeats
      const mealsToChoose = availableMeals.length > 0 ? availableMeals : MEAL_TEMPLATES[cuisine][mealType];

      // Randomly select a meal
      const selectedMeal = mealsToChoose[Math.floor(Math.random() * mealsToChoose.length)];
      usedMeals[mealType].add(selectedMeal);

      weeklyPlan[day][mealType] = {
        name: selectedMeal,
        cuisine: cuisine,
        targetCalories: calorieTarget[mealType]
      };
    });
  });

  return weeklyPlan;
}

/**
 * Get meal suggestion by cuisine and type
 * @param {string} cuisine - 'slavic' or 'asian'
 * @param {string} mealType - 'breakfast', 'snack', or 'dinner'
 * @returns {string} Meal name
 */
function getMealSuggestion(cuisine, mealType) {
  const meals = MEAL_TEMPLATES[cuisine]?.[mealType] || MEAL_TEMPLATES.slavic[mealType];
  return meals[Math.floor(Math.random() * meals.length)];
}

module.exports = {
  generateWeeklyMenu,
  getMealSuggestion,
  CALORIE_TARGETS,
  DAYS,
  MEAL_TYPES
};
