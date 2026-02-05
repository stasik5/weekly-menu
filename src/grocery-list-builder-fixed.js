/**
 * Grocery List Builder - Aggregates and categorizes ingredients
 * Combines duplicate ingredients and categorizes by type
 * NOW WITH METRIC UNIT CONVERSION
 * FIXED: Proper regex patterns to avoid corrupting ingredient names
 */

// Ingredient categories based on common food items
const CATEGORY_KEYWORDS = {
  produce: [
    'onion', 'garlic', 'tomato', 'potato', 'carrot', 'celery', 'pepper',
    'lettuce', 'spinach', 'cabbage', 'broccoli', 'cauliflower', 'cucumber',
    'mushroom', 'apple', 'banana', 'orange', 'lemon', 'lime', 'berry',
    'strawberry', 'blueberry', 'raspberry', 'avocado', 'herb', 'parsley',
    'dill', 'cilantro', 'basil', 'thyme', 'rosemary', 'ginger', 'scallion',
    'green onion', 'bean', 'peas', 'corn', 'zucchini', 'eggplant', 'squash'
  ],
  meat: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon',
    'tuna', 'shrimp', 'bacon', 'ham', 'sausage', 'meat', 'ground', 'steak',
    'breast', 'thigh', 'fillet', 'ribs', 'meatball'
  ],
  dairy: [
    'milk', 'cheese', 'butter', 'cream', 'sour cream', 'yogurt', 'cottage cheese',
    'kefir', 'cream cheese', 'ghee', 'egg', 'eggs'
  ],
  pantry: [
    'flour', 'sugar', 'salt', 'pepper', 'oil', 'olive oil', 'rice', 'pasta',
    'bread', 'noodle', 'bean', 'canned', 'tomato sauce', 'broth', 'stock',
    'vinegar', 'soy sauce', 'sauce', 'spice', 'honey', 'syrup', 'nut',
    'almond', 'walnut', 'cashew', 'peanut', 'seed', 'oat', 'cereal', 'grain',
    'flour', 'starch', 'powder', 'baking', 'yeast', 'cocoa', 'chocolate',
    'coconut milk', 'curry paste', 'miso', 'soybean', 'tofu', 'sesame'
  ],
  other: []
};

// Liquids that should use ml/L instead of cups/tbsp
const LIQUID_INGREDIENTS = [
  'milk', 'cream', 'sour cream', 'yogurt', 'kefir', 'oil', 'olive oil',
  'water', 'broth', 'stock', 'juice', 'wine', 'vinegar', 'sauce',
  'soy sauce', 'coconut milk', 'syrup', 'honey', 'lemon juice', 'lime juice'
];

/**
 * Categorize an ingredient based on its name
 * @param {string} ingredient - Ingredient text with quantity
 * @returns {string} Category name
 */
function categorizeIngredient(ingredient) {
  const lower = ingredient.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'other';
}

/**
 * Extract ingredient name (without quantity)
 * FIXED: Properly handles ranges like "4-5" and units attached like "200g"
 * Does not corrupt ingredient names by removing single letters
 * @param {string} fullIngredient - Full ingredient text with quantity
 * @returns {string} Just the ingredient name
 */
function extractIngredientName(fullIngredient) {
  // Remove leading numbers, fractions, ranges, and common measurement words
  // Fixed: Proper Unicode character class and complete word matches only
  let name = fullIngredient
    // Step 1: Remove number + optional range + optional unit (with or without space)
    .replace(/^[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?(?:\s*-\s*[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?)?(?:\s*\/\s*[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?)?(?:\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?)\s*)/i, '')
    // Step 2: Remove any remaining unit words at the start (must be complete words, not single letters)
    .replace(/^(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?)\s*/i, '')
    .replace(/^\s*\(|\)\s*$/g, '') // Remove surrounding parentheses
    .trim();

  // Keep first 3-5 words for better matching
  const words = name.split(/\s+/);
  return words.slice(0, 5).join(' ');
}

/**
 * Extract quantity from ingredient text
 * FIXED: Properly handles ranges like "4-5" and units attached like "200g"
 * @param {string} fullIngredient - Full ingredient text
 * @returns {string} Quantity string
 */
function extractQuantity(fullIngredient) {
  // Match: number (with fractions) + optional range + optional unit (with or without space)
  // Fixed: Proper Unicode character class and complete word matches only
  const match = fullIngredient.match(/^[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?(?:\s*-\s*[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?)?(?:\s*\/\s*[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?)?(?:\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?|milliliters?|pieces?|slices?)?\b/i);
  return match ? match[0].trim() : 'as needed';
}

/**
 * Combine quantities for same ingredient
 * @param {string} qty1 - First quantity
 * @param {string} qty2 - Second quantity
 * @returns {string} Combined quantity
 */
function combineQuantities(qty1, qty2) {
  // Helper to parse a quantity string to a numeric value and unit
  function parseQuantity(qty) {
    // Handle fractions: ½, ⅓, ⅔, ¼, ¾, ⅕, ⅛, ⅐, ⅑, ⅒
    const fractions = {
      '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
      '⅕': 0.2, '⅛': 0.125, '⅐': 0.143, '⅑': 0.111, '⅒': 0.1
    };

    const match = qty.match(/^[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|slice|slices|bunch|head|clove|cloves)?/i);
    if (!match) return { value: 0, unit: '' };

    let numStr = match[1];
    let value = 0;

    // Parse mixed numbers like "1½" by splitting integer and fraction parts
    // First, check if it contains a Unicode fraction character
    const hasUnicodeFraction = /[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]/.test(numStr);

    if (hasUnicodeFraction) {
      // Parse each character/segment separately
      let currentValue = 0;
      let buffer = '';
      for (let i = 0; i < numStr.length; i++) {
        const char = numStr[i];

        if (fractions[char]) {
          // Convert any pending integer part
          if (buffer) {
            currentValue += parseFloat(buffer);
            buffer = '';
          }
          // Add fraction
          currentValue += fractions[char];
        } else if (char >= '0' && char <= '9' || char === '.') {
          // Build up number string
          buffer += char;
        } else {
          // Convert any pending integer part before non-numeric
          if (buffer) {
            currentValue += parseFloat(buffer);
            buffer = '';
          }
        }
      }
      // Convert any remaining buffer
      if (buffer) {
        currentValue += parseFloat(buffer);
      }
      value = currentValue;
    } else {
      // Standard decimal number
      value = parseFloat(numStr);
    }

    const unit = match[2] ? match[2].toLowerCase() : '';

    return { value, unit };
  }

  const parsed1 = parseQuantity(qty1);
  const parsed2 = parseQuantity(qty2);

  // If both are numeric and have compatible units, add them
  if (parsed1.value > 0 && parsed2.value > 0) {
    if (parsed1.unit === parsed2.unit) {
      const sum = parsed1.value + parsed2.value;
      // Format result nicely
      const formatted = Number.isInteger(sum) ? sum : sum.toFixed(2).replace(/\.00$/, '');
      return `${formatted} ${parsed1.unit}`;
    } else if (parsed1.unit === '' || parsed2.unit === '') {
      // One has no unit, use the other's unit or just the sum
      const sum = parsed1.value + parsed2.value;
      const formatted = Number.isInteger(sum) ? sum : sum.toFixed(2).replace(/\.00$/, '');
      return parsed1.unit ? `${formatted} ${parsed1.unit}` : (parsed2.unit ? `${formatted} ${parsed2.unit}` : `${formatted}`);
    }
  }

  // Fallback: just concatenate if we can't add numerically
  return `${qty1} + ${qty2}`;
}

/**
 * Build grocery list from recipes
 * @param {Object} weeklyPlan - Weekly meal plan with recipes
 * @returns {Object} Organized grocery list by category
 */
function buildGroceryList(weeklyPlan) {
  const ingredientsMap = new Map();

  // Iterate through all days and meals
  for (const [day, meals] of Object.entries(weeklyPlan)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      if (!mealData.recipe || !mealData.recipe.ingredients) continue;

      const cuisine = mealData.cuisine || 'unknown';

      for (const ingredient of mealData.recipe.ingredients) {
        const name = extractIngredientName(ingredient);
        const quantity = extractQuantity(ingredient);
        const category = categorizeIngredient(ingredient);

        if (ingredientsMap.has(name)) {
          // Combine with existing ingredient
          const existing = ingredientsMap.get(name);
          existing.quantity = combineQuantities(existing.quantity, quantity);
          existing.usedIn.push({ day, mealType, cuisine });
        } else {
          // Add new ingredient
          ingredientsMap.set(name, {
            name,
            quantity,
            category,
            usedIn: [{ day, mealType, cuisine }]
          });
        }
      }
    }
  }

  // Organize by category
  const groceryList = {
    produce: [],
    meat: [],
    dairy: [],
    pantry: [],
    other: []
  };

  for (const ingredient of ingredientsMap.values()) {
    if (groceryList[ingredient.category]) {
      groceryList[ingredient.category].push(ingredient);
    } else {
      groceryList.other.push(ingredient);
    }
  }

  // Sort each category alphabetically
  for (const category of Object.keys(groceryList)) {
    groceryList[category].sort((a, b) => a.name.localeCompare(b.name));
  }

  return groceryList;
}

/**
 * Format grocery list as text
 * @param {Object} groceryList - Organized grocery list
 * @returns {string} Formatted text representation
 */
function formatGroceryListText(groceryList) {
  let text = '';

  for (const [category, items] of Object.entries(groceryList)) {
    if (items.length === 0) continue;

    text += `\n## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
    for (const item of items) {
      text += `- ${item.name} (${item.quantity})\n`;
    }
  }

  return text;
}

/**
 * Check if ingredient is a liquid
 * @param {string} ingredientName - Name of ingredient
 * @returns {boolean} True if liquid
 */
function isLiquid(ingredientName) {
  const lower = ingredientName.toLowerCase();
  return LIQUID_INGREDIENTS.some(keyword => lower.includes(keyword));
}

/**
 * Convert quantity to metric units
 * @param {string} quantity - Quantity string with unit
 * @param {string} ingredientName - Name of ingredient for liquid check
 * @returns {string} Metric quantity with original in brackets
 */
function convertToMetric(quantity, ingredientName) {
  // Match quantity and unit
  const match = quantity.match(/^[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]+(?:\.\d+)?\s*(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves)?/i);

  if (!match) {
    return quantity; // No recognizable quantity/unit
  }

  const numStr = match[1];
  const unit = match[2] ? match[2].toLowerCase() : '';
  const isLiquidIngredient = isLiquid(ingredientName);

  // Parse numeric value
  const fractions = {
    '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅛': 0.125, '⅐': 0.143, '⅑': 0.111, '⅒': 0.1
  };

  let value = 0;
  const hasUnicodeFraction = /[\u00BD-\u2153-\u2154-\u00BC-\u00BE-\u2150-\u215E\u2155-\u215F]/.test(numStr);

  if (hasUnicodeFraction) {
    let currentValue = 0;
    let buffer = '';
    for (let i = 0; i < numStr.length; i++) {
      const char = numStr[i];
      if (fractions[char]) {
        if (buffer) {
          currentValue += parseFloat(buffer);
          buffer = '';
        }
        currentValue += fractions[char];
      } else if (char >= '0' && char <= '9' || char === '.') {
        buffer += char;
      } else {
        if (buffer) {
          currentValue += parseFloat(buffer);
          buffer = '';
        }
      }
    }
    if (buffer) {
      currentValue += parseFloat(buffer);
    }
    value = currentValue;
  } else {
    value = parseFloat(numStr);
  }

  // Convert to metric if needed
  let metricValue = value;
  let metricUnit = unit;

  if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') {
    // oz → g
    metricValue = Math.round(value * 28.35);
    metricUnit = 'g';
  } else if (unit === 'lb' || unit === 'pound' || unit === 'pounds') {
    // lbs → kg
    metricValue = (value * 0.4536).toFixed(2);
    if (metricValue.endsWith('.00')) {
      metricValue = metricValue.slice(0, -3);
    }
    metricUnit = 'kg';
  } else if (unit === 'cup' || unit === 'cups') {
    if (isLiquidIngredient) {
      // cups → ml for liquids
      metricValue = Math.round(value * 240);
      metricUnit = 'ml';
    } else {
      // cups → g for solids (approximate, varies by ingredient)
      // For flour, ~120g per cup; for sugar, ~200g per cup; default to 150g
      let gPerCup = 150;
      const lower = ingredientName.toLowerCase();
      if (lower.includes('flour')) {
        gPerCup = 120;
      } else if (lower.includes('sugar')) {
        gPerCup = 200;
      } else if (lower.includes('cheese') || lower.includes('butter')) {
        gPerCup = 227;
      }
      metricValue = Math.round(value * gPerCup);
      metricUnit = 'g';
    }
  } else if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') {
    if (isLiquidIngredient) {
      // tbsp → ml for liquids
      metricValue = Math.round(value * 15);
      metricUnit = 'ml';
    } else {
      // tbsp → g for solids
      metricValue = Math.round(value * 15); // Approximate
      metricUnit = 'g';
    }
  } else if (unit === 'tsp' || unit === 'teaspoon' || unit === 'teaspoons') {
    if (isLiquidIngredient) {
      // tsp → ml for liquids
      metricValue = Math.round(value * 5);
      metricUnit = 'ml';
    } else {
      // tsp → g for solids
      metricValue = Math.round(value * 5); // Approximate
      metricUnit = 'g';
    }
  }

  // If unit is already metric (g, kg, ml, l), keep it
  if (['g', 'kg', 'ml', 'l', 'liter', 'liters'].includes(unit)) {
    return quantity;
  }

  // Format result: metric with original in brackets
  // e.g., "120g (1/2 cup)" or "500ml (2 cups)"
  const originalDisplay = unit ? `${value} ${unit}` : quantity;
  const metricDisplay = `${metricValue} ${metricUnit}`;

  return `${metricDisplay} (${originalDisplay})`;
}

/**
 * Update grocery list quantities to metric units
 * @param {Object} groceryList - Organized grocery list
 * @returns {Object} Updated grocery list with metric quantities
 */
function updateToMetricUnits(groceryList) {
  console.log('\n📏 Converting to metric units...\n');

  const updatedList = JSON.parse(JSON.stringify(groceryList));

  for (const [category, items] of Object.entries(updatedList)) {
    for (const item of items) {
      item.quantity = convertToMetric(item.quantity, item.name);
    }
  }

  console.log('✓ All quantities converted to metric\n');

  return updatedList;
}

module.exports = {
  categorizeIngredient,
  extractIngredientName,
  extractQuantity,
  combineQuantities,
  buildGroceryList,
  formatGroceryListText,
  isLiquid,
  convertToMetric,
  updateToMetricUnits,
  CATEGORY_KEYWORDS,
  LIQUID_INGREDIENTS
};
