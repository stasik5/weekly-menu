/**
 * Pantry Normalizer Module
 * Simplifies ingredient names by stripping prep methods and merging duplicates
 */

/**
 * Regular expressions for prep methods to remove
 * Ordered from specific to general for better matching
 */
const PREP_METHODS = [
  // Specific multi-word combinations (must come before single words)
  /\bseeded and chopped\b/gi,
  /\bseeded and sliced\b/gi,
  /\bfinely chopped\b/gi,
  /\blightly sautéed\b/gi,
  /\bdiced into\b/gi,
  /\bsliced into\b/gi,
  /\bcut into\b/gi,

  // Common prep methods
  /\bchopped\b/gi,
  /\bsliced\b/gi,
  /\bdiced\b/gi,
  /\bcrumbled\b/gi,
  /\bgrated\b/gi,
  /\bminced\b/gi,
  /\bshredded\b/gi,
  /\bjulienne\b/gi,
  /\bcubed\b/gi,
  /\bquartered\b/gi,
  /\bhalved\b/gi,
  /\bpeeled\b/gi,
  /\bseeded\b/gi,
  /\bdeseeded\b/gi,
  /\bcored\b/gi,
  /\btrimmed\b/gi,
  /\bwashed\b/gi,
  /\bcleaned\b/gi,
  /\bdried\b/gi,

  // State descriptions
  /\bfresh\b/gi,
  /\bfrozen\b/gi,
  /\bcanned\b/gi,
  /\bpacked\b/gi,
  /\bdrained\b/gi,
  /\brinsed\b/gi,

  // Cooking methods
  /\btoasted\b/gi,
  /\broasted\b/gi,
  /\bsteamed\b/gi,
  /\bboiled\b/gi,
  /\bbaked\b/gi,
  /\bfried\b/gi,
  /\bgrilled\b/gi,
  /\bsmoked\b/gi,

  // Flavorings
  /\bmarinated\b/gi,
  /\bpickled\b/gi,
  /\bseasoned\b/gi,
  /\bsalted\b/gi,
  /\bpeppered\b/gi,
  /\bspiced\b/gi,
  /\bherbed\b/gi,
  /\bflavored\b/gi,
  /\binfused\b/gi,

  // Cooked state
  /\bcooked\b/gi,
  /\buncooked\b/gi,
  /\braw\b/gi,
  /\bprepared\b/gi,
  /\bready\b/gi
];

// Usage notes to remove
const USAGE_NOTES = [
  /\bfor garnish\b/gi,
  /\bfor serving\b/gi,
  /\bfor topping\b/gi,
  /\bfor decoration\b/gi,
  /\bto serve\b/gi,
  /\bto taste\b/gi,
  /\bserving\b/gi
];

/**
 * Normalize ingredient name by removing prep methods and other noise
 * @param {string} name - Original ingredient name
 * @returns {string} Cleaned ingredient name
 */
function normalizeIngredientName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  let cleaned = name.trim();

  // Remove parenthetical notes (e.g., "(organic)", "(for serving)")
  cleaned = cleaned.replace(/\([^)]*\)/g, '');

  // Remove prep methods
  for (const regex of PREP_METHODS) {
    cleaned = cleaned.replace(regex, '');
  }

  // Remove usage notes
  for (const regex of USAGE_NOTES) {
    cleaned = cleaned.replace(regex, '');
  }

  // Remove extra whitespace, commas, and trailing punctuation
  cleaned = cleaned
    .replace(/\s+/g, ' ')  // Multiple spaces to single
    .replace(/,\s*,/g, ',')  // Double commas
    .replace(/,\s*$/, '')    // Trailing comma
    .replace(/^,\s*/, '')    // Leading comma
    .trim();

  return cleaned;
}

/**
 * Parse a quantity string to extract value and unit
 * @param {string} quantityStr - Quantity string (e.g., "2 cups", "500g", "1/2 tsp")
 * @returns {Object} { value: number, unit: string }
 */
function parseQuantity(quantityStr) {
  if (!quantityStr || typeof quantityStr !== 'string') {
    return { value: 0, unit: '' };
  }

  const str = quantityStr.trim();

  // Try to match a number at the start
  const match = str.match(/^([\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+)?)/);

  if (!match) {
    return { value: 0, unit: str };
  }

  let value = parseFractionString(match[1]);
  let unit = str.substring(match[0].length).trim();

  // Remove trailing comma if present
  unit = unit.replace(/,$/, '').trim();

  return { value, unit };
}

/**
 * Parse a fraction string to a decimal number
 * @param {string} str - String containing numbers and fractions
 * @returns {number} Decimal value
 */
function parseFractionString(str) {
  // Unicode fractions
  const unicodeFractions = {
    '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅛': 0.125, '⅐': 0.143, '⅑': 0.111, '⅒': 0.1
  };

  let total = 0;
  let current = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (unicodeFractions[char]) {
      if (current) {
        total += parseFloat(current);
        current = '';
      }
      total += unicodeFractions[char];
    } else if (char === ' ' || char === '/') {
      // Skip for now - handle space-separated or slash-separated fractions
      if (current) {
        total += parseFloat(current);
        current = '';
      }
    } else if (/\d/.test(char) || char === '.') {
      current += char;
    }
  }

  if (current) {
    total += parseFloat(current);
  }

  return total;
}

/**
 * Combine two quantities with compatible units
 * @param {string|number} qty1 - First quantity
 * @param {string|number} qty2 - Second quantity
 * @returns {string} Combined quantity
 */
function combineQuantities(qty1, qty2) {
  // Convert to string if needed
  const str1 = String(qty1 || '').trim();
  const str2 = String(qty2 || '').trim();

  if (!str1 || !str2) {
    return str1 || str2 || '';
  }

  // Parse both quantities
  const parsed1 = parseQuantity(str1);
  const parsed2 = parseQuantity(str2);

  // If units are compatible, combine values
  if (parsed1.unit === parsed2.unit) {
    const combined = parsed1.value + parsed2.value;
    const rounded = Math.round(combined * 100) / 100; // Round to 2 decimals

    // If it's a whole number, return as integer
    if (rounded === Math.floor(rounded)) {
      return Math.floor(rounded) + (parsed1.unit ? ` ${parsed1.unit}` : '');
    }

    return rounded + (parsed1.unit ? ` ${parsed1.unit}` : '');
  }

  // Incompatible units - return combined as string
  return `${str1} + ${str2}`;
}

/**
 * Normalize a list of ingredients
 * Strips prep methods and merges duplicate ingredients
 * @param {Array} ingredients - Array of ingredient objects or strings
 * @returns {Array} Normalized ingredients
 */
function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  const normalized = [];

  for (const item of ingredients) {
    // Handle both object and string formats
    let name, quantity, fullItem;

    if (typeof item === 'string') {
      name = item;
      quantity = null;
      fullItem = { name };
    } else if (typeof item === 'object' && item !== null) {
      name = item.name || '';
      quantity = item.quantity || null;
      fullItem = { ...item };
    } else {
      continue;
    }

    const cleanName = normalizeIngredientName(name);

    if (!cleanName) {
      continue;
    }

    // Check if we already have this ingredient
    const existing = normalized.find(n => {
      const existingClean = normalizeIngredientName(n.name || '');
      return existingClean.toLowerCase() === cleanName.toLowerCase();
    });

    if (existing) {
      // Merge quantities
      if (quantity && existing.quantity) {
        existing.quantity = combineQuantities(existing.quantity, quantity);
      } else if (quantity) {
        existing.quantity = quantity;
      }

      // Keep the original name if it had a quantity, otherwise use cleaned
      if (quantity && !existing.quantity) {
        existing.name = cleanName;
      }
    } else {
      // Add new ingredient with cleaned name
      normalized.push({
        ...fullItem,
        name: cleanName
      });
    }
  }

  return normalized;
}

/**
 * Normalize a grocery list (categorized ingredients)
 * @param {Object} groceryList - Object with category → ingredient array
 * @returns {Object} Normalized grocery list
 */
function normalizeGroceryList(groceryList) {
  if (!groceryList || typeof groceryList !== 'object') {
    return {};
  }

  const normalized = {};

  for (const [category, items] of Object.entries(groceryList)) {
    if (Array.isArray(items)) {
      normalized[category] = normalizeIngredients(items);
    }
  }

  return normalized;
}

/**
 * Normalize ingredients from all recipes in a weekly plan
 * @param {Object} weeklyPlan - Weekly plan with days → meals → recipe
 * @returns {Object} Weekly plan with normalized ingredients
 */
function normalizeWeeklyPlan(weeklyPlan) {
  if (!weeklyPlan || typeof weeklyPlan !== 'object') {
    return weeklyPlan;
  }

  const normalized = JSON.parse(JSON.stringify(weeklyPlan));

  for (const [day, meals] of Object.entries(normalized)) {
    for (const [mealType, mealData] of Object.entries(meals)) {
      if (mealData.recipe && mealData.recipe.ingredients) {
        mealData.recipe.ingredients = normalizeIngredients(mealData.recipe.ingredients);
      }
    }
  }

  return normalized;
}

module.exports = {
  normalizeIngredientName,
  parseQuantity,
  combineQuantities,
  normalizeIngredients,
  normalizeGroceryList,
  normalizeWeeklyPlan
};
