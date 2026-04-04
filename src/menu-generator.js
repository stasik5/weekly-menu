// Menu Generator for Grocery Planner
// Creates a balanced weekly meal plan with 60% Slavic/pasta and 40% Asian cuisine

const fs = require('fs');
const path = require('path');

// Meal type definitions
const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  SNACK: 'snack',
  DINNER: 'dinner'
};

// Cuisine types
const CUISINE_TYPES = {
  SLAVIC: 'slavic',
  ASIAN: 'asian'
};

// Meal database with real meal names (will be replaced with researched recipes)
const MEAL_DATABASE = {
  breakfast: {
    slavic: [
      'Buckwheat Porridge with Butter and Cheese',
      'Oatmeal with Honey and Nuts',
      'Syrniki (Cheese Pancakes) with Sour Cream',
      'Blini (Russian Pancakes) with Jam',
      'Scrambled Eggs with Dill and Herbs',
      'Russian-style Yogurt with Berries',
      'Curds with Honey and Raisins',
      'Semolina Porridge with Cinnamon',
      'Farina Breakfast with Milk',
      'Tvorog (Cottage Cheese) Casserole'
    ],
    asian: [
      'Congee with Eggs and Century',
      'Fried Rice with Eggs and Vegetables',
      'Steamed Buns with Sweet Fillings',
      'Rice Porridge with Sesame and Ginger',
      'Miso Soup with Tofu and Green Onions',
      'Dim Sum Breakfast Platter',
      'Rice Noodle Soup with Pork',
      'Tofu Scramble with Soy Sauce',
      'Banana Pancakes with Coconut',
      'Red Bean Paste Buns'
    ]
  },
  snack: {
    slavic: [
      'Cottage Cheese with Apple Slices',
      'Yogurt with Honey and Granola',
      'Cheese and Cucumber Sandwiches',
      'Pickled Vegetables with Rye Bread',
      'Varenyky (Dumplings) with Sour Cream',
      'Blini with Smoked Salmon',
      'Cottage Cheese Pancakes',
      'Rye Crackers with Cheese',
      'Pickled Tomatoes and Cucumbers',
      'Kvass (Traditional Drink)'
    ],
    asian: [
      'Edamame with Sea Salt',
      'Seaweed Snacks with Wasabi',
      'Mango Sticky Rice',
      'Pickled Ginger with Sesame',
      'Spring Rolls with Sweet Chili',
      'Mochi with Red Bean Paste',
      'Edamame Hummus with Vegetables',
      'Asian Pear with Chili Salt',
      'Gyoza with Soy Dipping Sauce',
      'Tempura Vegetables'
    ]
  },
  dinner: {
    slavic: [
      'Borscht (Beetroot Soup) with Smetana',
      'Chicken Noodle Soup with Dill',
      'Beef Stroganoff with Mashed Potatoes',
      'Pelmeni (Siberian Dumplings) with Butter',
      'Cabbage Rolls with Meat and Rice',
      'Solyanka (Fish Soup) with Lemon',
      'Golubtsy (Stuffed Cabbage)',
      'Zharkoe (Meat Stew) with Potatoes',
      'Kotleti (Meat Patties) with Mashed Potatoes',
      'Shchi (Cabbage Soup) with Smetana'
    ],
    asian: [
      'Chicken Teriyaki with Rice',
      'Pad Thai with Shrimp and Peanuts',
      'Pho with Beef and Herbs',
      'Bibimbap with Mixed Vegetables',
      'Green Curry with Coconut Milk',
      'Korean BBQ Short Ribs',
      'Sushi Platter with Miso Soup',
      'Ramen with Pork and Eggs',
      'Tom Yum Soup with Seafood',
      'Stir-fried Noodles with Vegetables'
    ]
  }
};

// Nutrition targets for 2 adults (combined daily values)
const NUTRITION_TARGETS = {
  lower: { calories: 3400, protein: 150, carbs: 325, fat: 100 },
  medium: { calories: 4000, protein: 170, carbs: 425, fat: 130 },
  higher: { calories: 4700, protein: 190, carbs: 525, fat: 160 }
};

// Calorie distribution per meal type (2 adults)
const CALORIE_DISTRIBUTION = {
  breakfast: { lower: 1200, medium: 1300, higher: 1500 },
  snack: { lower: 400, medium: 500, higher: 600 },
  dinner: { lower: 1800, medium: 1900, higher: 2200 }
};

class MenuGenerator {
  constructor(config) {
    this.config = config;
    this.nutrition = NUTRITION_TARGETS[config.nutrition];
    this.weeklyCalories = this.nutrition.calories * 7;
    this.nutritionLevel = config.nutrition;
  }

  // Generate a complete weekly menu
  generateWeeklyMenu() {
    console.log(`Generating weekly menu for ${this.config.nutrition} nutrition level`);
    
    // Calculate required meal counts
    const mealsPerWeek = {
      breakfast: 7,
      snack: 7,
      dinner: 7
    };

    // Track meal usage to ensure variety
    const usedMeals = {
      breakfast: new Set(),
      snack: new Set(),
      dinner: new Set()
    };

    // Generate menu for each meal type
    const weeklyMenu = {};
    
    for (const mealType of Object.keys(mealsPerWeek)) {
      weeklyMenu[mealType] = [];
      
      for (let day = 0; day < mealsPerWeek[mealType]; day++) {
        // Determine cuisine based on ratio and variety requirement
        const cuisine = this.selectCuisine(mealType, day, weeklyMenu);
        
        // Select meal ensuring variety
        const meal = this.selectMeal(mealType, cuisine, usedMeals[mealType]);
        usedMeals[mealType].add(meal);
        
        weeklyMenu[mealType].push({
          day: day + 1,
          name: meal,
          cuisine: cuisine,
          estimatedCalories: CALORIE_DISTRIBUTION[mealType][this.nutritionLevel]
        });
      }
    }

    // Calculate nutrition summary
    const nutritionSummary = this.calculateNutritionSummary(weeklyMenu);
    
    // Validate cuisine distribution
    const cuisineStats = this.calculateCuisineDistribution(weeklyMenu);
    
    return {
      week: this.getCurrentWeek(),
      nutrition: this.config.nutrition,
      dailyTarget: this.nutrition,
      menu: weeklyMenu,
      nutritionSummary,
      cuisineStats,
      generatedAt: new Date().toISOString(),
      recipes: {} // Will be populated by recipe research
    };
  }

  // Select cuisine type based on ratio and variety
  selectCuisine(mealType, day, existingMenu) {
    const isSlavicPreferred = this.config.people[0].preference === 'slavic' && mealType === 'dinner';
    
    // Adjust ratio based on person preferences
    let slavicRatio = this.config.cuisine.slavicRatio;
    
    // Slavic person prefers dinner, so increase slavic for dinner
    if (isSlavicPreferred) {
      slavicRatio = Math.min(0.7, slavicRatio + 0.1);
    }
    
    // Add some randomness while maintaining ratio
    const slavicChance = 0.5 + (slavicRatio - 0.5);
    return Math.random() < slavicChance ? CUISINE_TYPES.SLAVIC : CUISINE_TYPES.ASIAN;
  }

  // Select a meal ensuring variety
  selectMeal(mealType, cuisine, usedMeals) {
    const availableMeals = MEAL_DATABASE[mealType][cuisine];
    
    // Filter out already used meals
    const unusedMeals = availableMeals.filter(meal => !usedMeals.has(meal));
    
    // If all meals used, reset and choose randomly
    const mealPool = unusedMeals.length > 0 ? unusedMeals : availableMeals;
    
    // Select random meal from pool
    const randomIndex = Math.floor(Math.random() * mealPool.length);
    return mealPool[randomIndex];
  }

  // Calculate nutrition summary for the week
  calculateNutritionSummary(weeklyMenu) {
    const mealCount = {
      breakfast: 7,
      snack: 7,
      dinner: 7
    };

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Calculate based on meal types
    for (const mealType of Object.keys(mealCount)) {
      const mealCalories = CALORIE_DISTRIBUTION[mealType][this.nutritionLevel];
      const mealMultiplier = mealCount[mealType];
      
      totalCalories += mealCalories * mealMultiplier;
      
      // Estimate macros based on meal type
      if (mealType === 'breakfast') {
        totalProtein += mealCalories * 0.15 * mealMultiplier / 4; // 15% protein
        totalCarbs += mealCalories * 0.50 * mealMultiplier / 4;   // 50% carbs
        totalFat += mealCalories * 0.35 * mealMultiplier / 9;     // 35% fat
      } else if (mealType === 'snack') {
        totalProtein += mealCalories * 0.20 * mealMultiplier / 4; // 20% protein
        totalCarbs += mealCalories * 0.55 * mealMultiplier / 4;   // 55% carbs
        totalFat += mealCalories * 0.25 * mealMultiplier / 9;     // 25% fat
      } else if (mealType === 'dinner') {
        totalProtein += mealCalories * 0.25 * mealMultiplier / 4; // 25% protein
        totalCarbs += mealCalories * 0.40 * mealMultiplier / 4;   // 40% carbs
        totalFat += mealCalories * 0.35 * mealMultiplier / 9;     // 35% fat
      }
    }

    return {
      weekly: {
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat)
      },
      daily: {
        calories: Math.round(totalCalories / 7),
        protein: Math.round(totalProtein / 7),
        carbs: Math.round(totalCarbs / 7),
        fat: Math.round(totalFat / 7)
      },
      target: this.nutrition,
      deviation: {
        calories: Math.abs(Math.round(totalCalories / 7) - this.nutrition.calories),
        percentage: Math.abs(Math.round((totalCalories / 7 - this.nutrition.calories) / this.nutrition.calories * 100))
      }
    };
  }

  // Calculate cuisine distribution
  calculateCuisineDistribution(weeklyMenu) {
    const totalMeals = 21; // 7 days * 3 meals
    const slavicCount = { breakfast: 0, snack: 0, dinner: 0 };
    const asianCount = { breakfast: 0, snack: 0, dinner: 0 };

    // Count meals by cuisine
    for (const mealType of Object.keys(weeklyMenu)) {
      for (const meal of weeklyMenu[mealType]) {
        if (meal.cuisine === CUISINE_TYPES.SLAVIC) {
          slavicCount[mealType]++;
        } else {
          asianCount[mealType]++;
        }
      }
    }

    const totalSlavic = Object.values(slavicCount).reduce((a, b) => a + b, 0);
    const totalAsian = Object.values(asianCount).reduce((a, b) => a + b, 0);

    return {
      slavic: {
        count: totalSlavic,
        percentage: Math.round((totalSlavic / totalMeals) * 100),
        byMealType: slavicCount
      },
      asian: {
        count: totalAsian,
        percentage: Math.round((totalAsian / totalMeals) * 100),
        byMealType: asianCount
      },
      target: {
        slavic: Math.round(this.config.cuisine.slavicRatio * 100),
        asian: Math.round(this.config.cuisine.asianRatio * 100)
      }
    };
  }

  // Get current week identifier
  getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }

  // Validate menu meets requirements
  validateMenu(menu) {
    const issues = [];
    
    // Check cuisine distribution
    if (menu.cuisineStats.slavic.percentage < 50 || menu.cuisineStats.slavic.percentage > 70) {
      issues.push(`Cuisine distribution off target: ${menu.cuisineStats.slavic.percentage}% Slavic (target: ${menu.cuisineStats.target.slavic}%)`);
    }
    
    // Check nutrition deviation
    if (menu.nutritionSummary.deviation.percentage > 20) {
      issues.push(`Nutrition deviation too high: ${menu.nutritionSummary.deviation.percentage}% (max: 20%)`);
    }
    
    // Check for meal variety
    for (const mealType of Object.keys(menu.menu)) {
      const uniqueMeals = new Set(menu.menu[mealType].map(m => m.name));
      if (uniqueMeals.size < 5) {
        issues.push(`Low variety in ${mealType}: only ${uniqueMeals.size} unique meals`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

module.exports = MenuGenerator;