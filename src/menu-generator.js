/**
 * Menu Generator - Creates weekly meal plans with Russian names
 * Generates 7 days × 3 meals (breakfast, snack, dinner)
 * Alternates between Slavic/pasta (60%) and Asian (40%) cuisines
 * All meal names are in Russian for direct web_search queries
 */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'snack', 'dinner'];

// Meal templates with calorie targets and cuisine types (RUSSIAN NAMES)
const MEAL_TEMPLATES = {
  // Slavic/Pasta meals (60% preference)
  slavic: {
    breakfast: [
      'Гречневая каша с молоком и ягодами',           // Buckwheat porridge with milk and berries
      'Овсянка с мёдом и орехами',                  // Oatmeal with honey and nuts
      'Жареные яйца с хлебом',                       // Fried eggs with bread
      'Сырники (творожные оладьи)',                  // Syrniki (cottage cheese pancakes)
      'Блины с сырной начинкой',                      // Blini with cheese filling
      'Каша с маслом и молоком',                      // Kasha with butter and milk
      'Яичница с овощами'                             // Scrambled eggs with vegetables
    ],
    snack: [
      'Дольки яблока с сыром',                        // Apple slices with cheese
      'Йогурт с мёдом',                              // Yogurt with honey
      'Орехи и сухофрукты',                          // Nuts and dried fruits
      'Творог с зеленью',                             // Cottage cheese with herbs
      'Банан с арахисовой пастой',                   // Banana with peanut butter
      'Маринованные овощи',                           // Pickled vegetables
      'Ржаной хлеб с маслом'                         // Ryebread with butter
    ],
    dinner: [
      'Куриный суп с овощами',                        // Chicken soup with vegetables
      'Борщ со сметаной',                            // Borscht with sour cream
      'Бефстроганов с рисом',                         // Beef stroganoff with rice
      'Пельмени со сметаной',                         // Pelmeni with sour cream
      'Шашлык с салатом',                            // Shashlik (grilled meat) with salad
      'Паста карбонара',                             // Pasta carbonara
      'Голубцы с мясом'                              // Cabbage rolls with meat
    ]
  },
  // Asian meals (40% preference)
  asian: {
    breakfast: [
      'Конджи с яйцом и зелёным луком',              // Congee with egg and scallions
      'Паровые булочки со свининой',                  // Steamed buns with pork
      'Рисовая каша с соленьями',                     // Rice porridge with pickles
      'Жареный рис с овощами',                        // Fried rice with vegetables
      'Мисо-суп с тофу',                            // Miso soup with tofu
      'Лапша с яйцом',                               // Rice noodles with egg
      'Дим самы (паровые пельмени)'                  // Dim sum dumplings
    ],
    snack: [
      'Эдамаме с морской солью',                      // Edamame with sea salt
      'Чипсы из морской капусты',                     // Seaweed snacks
      'Рисовые крекеры',                              // Rice crackers
      'Маринованный имбирь и дайкон',                 // Pickled ginger and daikon
      'Дольки манго',                                // Mango slices
      'Печенье с зелёным чаем',                      // Green tea cookies
      'Жареный тофу кубиками'                        // Fried tofu cubes
    ],
    dinner: [
      'Куриный терияки с рисом',                      // Chicken teriyaki with rice
      'Пад тай с креветками',                         // Pad Thai with shrimp
      'Вьетнамский фо',                               // Vietnamese pho
      'Корейский бибимбап',                          // Korean bibimbap
      'Сычуаньский мапо тофу',                       // Sichuan mapo tofu
      'Тайский зелёный карри',                        // Thai green curry
      'Японская лапша рамэн'                          // Japanese ramen
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
