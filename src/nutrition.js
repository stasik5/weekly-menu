/**
 * Nutrition Calculator - Calculates and validates nutrition information
 */

// Nutrition targets per level (for 2 adults)
// These are calculated based on the meal calorie distribution:
// - Breakfast: 35.3% of total calories
// - Snack: 11.8% of total calories
// - Dinner: 52.9% of total calories
const NUTRITION_TARGETS = {
  lower: {
    daily: { calories: 3400, protein: 173, carbs: 305, fat: 166 },
    weekly: { calories: 23800, protein: 1211, carbs: 2135, fat: 1162 }
  },
  medium: {
    daily: { calories: 4000, protein: 203, carbs: 358, fat: 196 },
    weekly: { calories: 28000, protein: 1421, carbs: 2506, fat: 1372 }
  },
  higher: {
    daily: { calories: 4700, protein: 238, carbs: 420, fat: 231 },
    weekly: { calories: 32900, protein: 1666, carbs: 2940, fat: 1617 }
  }
};

/**
 * Calculate daily nutrition from weekly plan
 * @param {Object} weeklyPlan - Weekly meal plan with recipes
 * @returns {Object} Daily and weekly nutrition totals
 */
function calculateNutrition(weeklyPlan) {
  const dailyTotals = {};
  const weeklyTotal = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Initialize daily totals
  for (const day of Object.keys(weeklyPlan)) {
    dailyTotals[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  // Sum up nutrition from each meal
  for (const [day, meals] of Object.entries(weeklyPlan)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      const nutrition = mealData.recipe?.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };

      dailyTotals[day].calories += nutrition.calories;
      dailyTotals[day].protein += nutrition.protein;
      dailyTotals[day].carbs += nutrition.carbs;
      dailyTotals[day].fat += nutrition.fat;

      weeklyTotal.calories += nutrition.calories;
      weeklyTotal.protein += nutrition.protein;
      weeklyTotal.carbs += nutrition.carbs;
      weeklyTotal.fat += nutrition.fat;
    }
  }

  return {
    daily: dailyTotals,
    weekly: weeklyTotal
  };
}

/**
 * Calculate averages from daily totals
 * @param {Object} dailyTotals - Daily nutrition totals
 * @returns {Object} Averages
 */
function calculateAverages(dailyTotals) {
  const days = Object.keys(dailyTotals);
  const count = days.length;

  if (count === 0) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const day of days) {
    sum.calories += dailyTotals[day].calories;
    sum.protein += dailyTotals[day].protein;
    sum.carbs += dailyTotals[day].carbs;
    sum.fat += dailyTotals[day].fat;
  }

  return {
    calories: Math.round(sum.calories / count),
    protein: Math.round(sum.protein / count),
    carbs: Math.round(sum.carbs / count),
    fat: Math.round(sum.fat / count)
  };
}

/**
 * Check if nutrition is within acceptable range
 * @param {Object} actual - Actual nutrition values
 * @param {Object} target - Target nutrition values
 * @param {number} tolerance - Allowed deviation (default 0.2 = 20%)
 * @returns {Object} Validation results with flags
 */
function validateNutrition(actual, target, tolerance = 0.2) {
  const results = {};
  const flags = [];

  for (const key of ['calories', 'protein', 'carbs', 'fat']) {
    const diff = Math.abs(actual[key] - target[key]);
    const threshold = target[key] * tolerance;
    const withinTolerance = diff <= threshold;

    results[key] = {
      actual: actual[key],
      target: target[key],
      difference: diff,
      withinTolerance,
      percentage: ((actual[key] / target[key]) * 100).toFixed(1)
    };

    if (!withinTolerance) {
      flags.push({
        nutrient: key,
        actual: actual[key],
        target: target[key],
        deviation: ((diff / target[key]) * 100).toFixed(1)
      });
    }
  }

  return {
    results,
    flags,
    isValid: flags.length === 0
  };
}

/**
 * Generate nutrition summary report
 * @param {Object} calculated - Calculated nutrition data
 * @param {string} level - Nutrition level ('lower', 'medium', 'higher')
 * @returns {Object} Formatted summary
 */
function generateNutritionSummary(calculated, level = 'medium') {
  const targets = NUTRITION_TARGETS[level] || NUTRITION_TARGETS.medium;
  const averages = calculateAverages(calculated.daily);

  const dailyValidation = validateNutrition(averages, targets.daily);
  const weeklyValidation = validateNutrition(calculated.weekly, targets.weekly);

  return {
    level,
    targets,
    actual: {
      daily: averages,
      weekly: calculated.weekly
    },
    validation: {
      daily: dailyValidation,
      weekly: weeklyValidation
    },
    isValid: dailyValidation.isValid && weeklyValidation.isValid
  };
}

/**
 * Format nutrition summary as text
 * @param {Object} summary - Nutrition summary
 * @returns {string} Formatted text
 */
function formatNutritionSummary(summary) {
  let text = `## Nutrition Summary (${summary.level} level)\n\n`;
  text += `### Daily Average\n`;
  text += `- Calories: ${summary.actual.daily.calories} (target: ${summary.targets.daily.calories})\n`;
  text += `- Protein: ${summary.actual.daily.protein}g (target: ${summary.targets.daily.protein}g)\n`;
  text += `- Carbs: ${summary.actual.daily.carbs}g (target: ${summary.targets.daily.carbs}g)\n`;
  text += `- Fat: ${summary.actual.daily.fat}g (target: ${summary.targets.daily.fat}g)\n\n`;

  text += `### Weekly Total\n`;
  text += `- Calories: ${summary.actual.weekly.calories} (target: ${summary.targets.weekly.calories})\n`;
  text += `- Protein: ${summary.actual.weekly.protein}g (target: ${summary.targets.weekly.protein}g)\n`;
  text += `- Carbs: ${summary.actual.weekly.carbs}g (target: ${summary.targets.weekly.carbs}g)\n`;
  text += `- Fat: ${summary.actual.weekly.fat}g (target: ${summary.targets.weekly.fat}g)\n\n`;

  if (!summary.isValid) {
    text += `### ⚠️ Nutrition Flags\n`;
    for (const flag of [...summary.validation.daily.flags, ...summary.validation.weekly.flags]) {
      text += `- ${flag.nutrient}: ${flag.actual} vs target ${flag.target} (${flag.deviation}% deviation)\n`;
    }
  } else {
    text += `✅ All nutrition values within acceptable range\n`;
  }

  return text;
}

module.exports = {
  NUTRITION_TARGETS,
  calculateNutrition,
  calculateAverages,
  validateNutrition,
  generateNutritionSummary,
  formatNutritionSummary
};
