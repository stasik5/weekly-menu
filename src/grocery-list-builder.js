/**
 * Grocery List Builder - Aggregates and categorizes ingredients
 * Combines duplicate ingredients and categorizes by type
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

/**
 * Categorize an ingredient based on its name
 * @param {string|Object} ingredient - Ingredient text with quantity, or ingredient object
 * @returns {string} Category name
 */
function categorizeIngredient(ingredient) {
  // Handle both string and object formats
  let ingredientStr;

  if (typeof ingredient === 'string') {
    ingredientStr = ingredient;
  } else if (typeof ingredient === 'object' && ingredient !== null) {
    ingredientStr = ingredient.name || ingredient.title || '';
  } else {
    return 'other';
  }

  const lower = ingredientStr.toLowerCase();

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
 * Extract the ingredient name (without quantity)
 * @param {string|Object} fullIngredient - Full ingredient text with quantity, or ingredient object
 * @returns {string} Just the ingredient name
 */
function extractIngredientName(fullIngredient) {
  // Handle both string and object formats
  let ingredientStr;

  if (typeof fullIngredient === 'string') {
    ingredientStr = fullIngredient;
  } else if (typeof fullIngredient === 'object' && fullIngredient !== null) {
    ingredientStr = fullIngredient.name || fullIngredient.title || '';
  } else {
    return '';
  }

  // Handle Russian format: "ingredient - quantity"
  // e.g., "яйца - 3 шт" → "яйца"
  const dashMatch = ingredientStr.match(/^(.+?)\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?\s*(?:шт|г|кг|ч\.л\.|ст\.л\.|л|мл|cup|cups|tbsp|tsp|oz|lb|piece|pieces|slice|slices|bunch|head|clove|cloves)?\s*$/i);
  if (dashMatch) {
    ingredientStr = dashMatch[1];
  }

  // Remove leading numbers and common measurement words (for English format)
  let name = ingredientStr
    .replace(/^\d+[\s½⅓⅔¼¾⅕⅛⅐⅑⅒]?/, '') // Remove leading numbers
    .replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves|шт|г|кг|ч\.л\.|ст\.л\.|л|мл)\s*(of\s*)?/i, '') // Remove measurements
    .replace(/\s*\(.*?\)\s*/g, ' ') // Remove content in parentheses
    .replace(/[\(\)]/g, '') // Remove any remaining parentheses
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();

  // Keep first 3-5 words for better matching
  const words = name.split(/\s+/);
  return words.slice(0, 5).join(' ');
}

/**
 * Extract quantity from ingredient text
 * @param {string|Object} fullIngredient - Full ingredient text or ingredient object
 * @returns {string} Quantity string
 */
function extractQuantity(fullIngredient) {
  // Handle both string and object formats
  let ingredientStr;

  if (typeof fullIngredient === 'string') {
    ingredientStr = fullIngredient;
  } else if (typeof fullIngredient === 'object' && fullIngredient !== null) {
    // If object has a quantity property, use it
    if (fullIngredient.quantity) {
      return fullIngredient.quantity;
    }
    ingredientStr = fullIngredient.name || fullIngredient.title || '';
  } else {
    return 'as needed';
  }

  // Try both formats:
  // 1. "3 eggs" - quantity first
  // 2. "eggs - 3 шт" - ingredient first, quantity after dash
  let match = ingredientStr.match(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\s*(?:cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|slice|slices|bunch|head|clove|cloves|шт|г|кг|ч\.л\.|ст\.л\.|л|мл)?)/i);

  // If no match at start, try format "ingredient - quantity"
  if (!match) {
    match = ingredientStr.match(/-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?\s*(?:шт|г|кг|ч\.л\.|ст\.л\.|л|мл|cup|cups|tbsp|tsp|oz|lb|piece|pieces|slice|slices|bunch|head|clove|cloves)?\s*$/i);
    if (match) {
      // Return just the quantity part (after the dash)
      return match[0].replace(/^-\s*/, '').trim();
    }
  }

  return match ? match[0].trim() : 'as needed';
}

/**
 * Combine quantities for the same ingredient
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

    const match = qty.match(/^([\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|piece|pieces|slice|slices|bunch|head|clove|cloves|шт|г|кг|ч\.л\.|ст\.л\.|л|мл)?/i);
    if (!match) return { value: 0, unit: '' };

    let numStr = match[1];
    let value = 0;

    // Parse mixed numbers like "1½" by splitting integer and fraction parts
    // First, check if it contains a Unicode fraction character
    const hasUnicodeFraction = /[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]/.test(numStr);

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
          // Add the fraction
          currentValue += fractions[char];
        } else if (char >= '0' && char <= '9' || char === '.') {
          // Build up the number string
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
      // Format the result nicely
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

module.exports = {
  categorizeIngredient,
  extractIngredientName,
  extractQuantity,
  combineQuantities,
  buildGroceryList,
  formatGroceryListText,
  CATEGORY_KEYWORDS
};
