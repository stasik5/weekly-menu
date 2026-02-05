/**
 * Virtual Pantry Manager - Track weekly ingredient needs visually
 * Not a real inventory tracker - shows expected usage based on menu
 */

const fs = require('fs');
const path = require('path');

// Emoji mapping for common ingredients
const INGREDIENT_EMOJIS = {
  milk: '🥛', cheese: '🧀', butter: '🧈', eggs: '🥚', egg: '🥚',
  chicken: '🐔', beef: '🥩', pork: '🐖', fish: '🐟', shrimp: '🦐',
  onion: '🧅', garlic: '🧄', tomato: '🍅', potato: '🥔', carrot: '🥕',
  lettuce: '🥬', broccoli: '🥦', mushroom: '🍄', cucumber: '🥒',
  apple: '🍎', banana: '🍌', orange: '🍊', lemon: '🍋', lime: '🟢',
  bread: '🍞', rice: '🍚', pasta: '🍝', noodle: '🍜', flour: '🌾',
  oil: '🫗', olive_oil: '🫗', salt: '🧂', pepper: '⚫', honey: '🍯',
  sugar: '🍬', yogurt: '🥛', cream: '🥛', sour_cream: '🥛',
  tofu: '🧊', beans: '🫘', corn: '🌽', peas: '🟢'
};

// Default emoji for unknown ingredients
const DEFAULT_EMOJI = '📦';

/**
 * Get emoji for ingredient name
 * @param {string} ingredientName - Name of ingredient
 * @returns {string} Emoji
 */
function getEmojiForIngredient(ingredientName) {
  const lower = ingredientName.toLowerCase();

  for (const [name, emoji] of Object.entries(INGREDIENT_EMOJIS)) {
    if (lower.includes(name)) {
      return emoji;
    }
  }

  // Try to find a suitable emoji based on category
  if (lower.includes('juice') || lower.includes('water') || lower.includes('milk') ||
      lower.includes('cream') || lower.includes('wine')) {
    return '🥤';
  }
  if (lower.includes('fruit') || lower.includes('berry')) {
    return '🍇';
  }
  if (lower.includes('vegetable') || lower.includes('veggie')) {
    return '🥬';
  }
  if (lower.includes('spice') || lower.includes('herb')) {
    return '🌿';
  }
  if (lower.includes('sauce') || lower.includes('dressing')) {
    return '🥫';
  }

  return DEFAULT_EMOJI;
}

/**
 * Parse quantity and unit from ingredient string
 * @param {string} ingredientText - Full ingredient text with quantity
 * @returns {Object} { value, unit, name }
 */
function parseIngredientQuantity(ingredientText) {
  const text = ingredientText.trim();

  // Try to extract quantity at the start
  const quantityMatch = text.match(/^([\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l|liter|piece|pieces|slice|slices|bunch|head|clove|cloves)?/i);

  if (!quantityMatch) {
    return { value: 0, unit: '', name: text };
  }

  let numStr = quantityMatch[1];
  let value = 0;

  // Handle fractions
  const fractions = {
    '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅛': 0.125, '⅐': 0.143, '⅑': 0.111, '⅒': 0.1
  };

  const hasUnicodeFraction = /[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]/.test(numStr);

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

  let unit = quantityMatch[2] ? quantityMatch[2].toLowerCase() : '';

  // Normalize units
  if (unit === 'c' || unit === 'cup' || unit === 'cups') {
    unit = 'cups';
  } else if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') {
    unit = 'tbsp';
  } else if (unit === 'tsp' || unit === 'teaspoon' || unit === 'teaspoons') {
    unit = 'tsp';
  } else if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') {
    unit = 'oz';
  } else if (unit === 'lb' || unit === 'pound' || unit === 'pounds') {
    unit = 'lb';
  } else if (unit === 'g' || unit === 'gram' || unit === 'grams') {
    unit = 'g';
  } else if (unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') {
    unit = 'kg';
  } else if (unit === 'l' || unit === 'liter' || unit === 'liters') {
    unit = 'l';
  }

  // Extract name (remove quantity and unit)
  let name = text
    .replace(quantityMatch[0], '')
    .replace(/^\s*of\s*/i, '')
    .trim();

  return { value, unit, name: name || ingredientText };
}

/**
 * Normalize ingredient name (remove singular/plural variations)
 * @param {string} name - Ingredient name
 * @returns {string} Normalized name
 */
function normalizeIngredientName(name) {
  return name
    .toLowerCase()
    .replace(/s$/, '') // Remove trailing 's' for plural
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate pantry data from grocery list and menu
 * @param {Object} groceryList - Grocery list from grocery-list-builder
 * @param {Object} menu - Weekly menu with recipes
 * @returns {Object} Pantry data structure
 */
function generatePantryFromGroceryList(groceryList, menu) {
  console.log('\n📦 Generating virtual pantry from recipes...\n');

  const pantry = {};
  const days = Object.keys(menu);

  // Generic ingredients to skip (fallback templates)
  const skipPatterns = [
    'main ingredients vary',
    'seasonings to taste',
    'cook according to recipe',
    'for blini',
    'for dough',
    'for filling',
    'for serving',
    'for teriyaki sauce',
    'for cheese filling',
    'optional:',
    'note:',
    'varies by recipe'
  ];

  // First pass: collect all ingredients from recipes (not grocery list)
  for (const day of days) {
    for (const [mealType, mealData] of Object.entries(menu[day])) {
      if (!mealData.recipe || !mealData.recipe.ingredients) continue;

      for (const ingredient of mealData.recipe.ingredients) {
        // Handle both string ingredients and object ingredients
        let ingredientText;
        if (typeof ingredient === 'string') {
          ingredientText = ingredient;
        } else if (typeof ingredient === 'object' && ingredient.item) {
          // New format: {item: "flour", quantity: "500g"}
          ingredientText = `${ingredient.quantity || ''} ${ingredient.item || ''}`.trim();
        } else {
          // Unknown format, skip
          continue;
        }

        const parsed = parseIngredientQuantity(ingredientText);
        const normalizedName = normalizeIngredientName(parsed.name);

        // Skip generic ingredients
        const lowerName = parsed.name.toLowerCase();
        if (skipPatterns.some(pattern => lowerName.includes(pattern))) {
          continue;
        }

        if (!pantry[normalizedName]) {
          // Create new pantry item
          pantry[normalizedName] = {
            emoji: getEmojiForIngredient(parsed.name),
            name: parsed.name,
            normalizedName,
            total: 0,  // Will be accumulated
            unit: parsed.unit,
            remaining: 0,
            dailyUsage: []
          };
        }

        // Accumulate total quantity needed
        pantry[normalizedName].total += parsed.value;
        pantry[normalizedName].dailyUsage.push({
          day,
          mealType,
          amount: parsed.value,
          unit: parsed.unit,
          meal: mealData.name
        });
      }
    }
  }

  // Set remaining equal to total (everything is initially "in pantry")
  for (const key of Object.keys(pantry)) {
    pantry[key].remaining = pantry[key].total;
  }

  console.log(`✓ Generated pantry with ${Object.keys(pantry).length} items\n`);

  return pantry;
}

/**
 * Deduct daily usage from pantry (simulated)
 * @param {Object} pantry - Pantry data
 * @param {Object} menu - Weekly menu
 * @returns {Object} Updated pantry with remaining amounts
 */
function deductDailyUsage(pantry, menu) {
  const updatedPantry = JSON.parse(JSON.stringify(pantry));

  for (const [normalizedName, pantryItem] of Object.entries(updatedPantry)) {
    let used = 0;

    for (const usage of pantryItem.dailyUsage) {
      used += usage.amount;
    }

    pantryItem.remaining = Math.max(0, pantryItem.total - used);
  }

  return updatedPantry;
}

/**
 * Format pantry display as HTML
 * @param {Object} pantry - Pantry data
 * @param {boolean} showDaily - Whether to show daily breakdown
 * @returns {string} HTML string
 */
function formatPantryDisplay(pantry, showDaily = false) {
  const items = Object.entries(pantry)
    .filter(([_, item]) => item.total > 0) // Only show items with quantities
    .sort((a, b) => {
      // Sort by remaining percentage (lowest first)
      const aRemainingPct = a[1].total > 0 ? a[1].remaining / a[1].total : 0;
      const bRemainingPct = b[1].total > 0 ? b[1].remaining / b[1].total : 0;
      return aRemainingPct - bRemainingPct;
    });

  if (items.length === 0) {
    return '<p>Нет продуктов для отображения.</p>';
  }

  let html = '';

  for (const [key, item] of items) {
    const remainingPct = item.total > 0 ? Math.round((item.remaining / item.total) * 100) : 0;

    // Color code based on remaining percentage
    let colorClass = 'high';
    if (remainingPct < 20) {
      colorClass = 'low';
    } else if (remainingPct < 50) {
      colorClass = 'medium';
    }

    html += `
      <div class="pantry-item">
        <span class="emoji">${item.emoji}</span>
        <span class="name">${item.name}</span>
        <span class="amount ${colorClass}">${item.remaining}/${item.total}${item.unit}</span>
        ${showDaily ? renderDailyBreakdown(item) : ''}
      </div>
    `;
  }

  return html;
}

/**
 * Render daily breakdown for a pantry item
 * @param {Object} item - Pantry item
 * @returns {string} HTML string
 */
function renderDailyBreakdown(item) {
  if (!item.dailyUsage || item.dailyUsage.length === 0) {
    return '<div class="daily-breakdown hidden">Нет использования</div>';
  }

  // Group by day
  const byDay = {};
  for (const usage of item.dailyUsage) {
    if (!byDay[usage.day]) {
      byDay[usage.day] = { amount: 0, unit: usage.unit, meals: [] };
    }
    byDay[usage.day].amount += usage.amount;
    byDay[usage.day].unit = usage.unit || byDay[usage.day].unit;
    byDay[usage.day].meals.push(usage.meal);
  }

  const breakdown = Object.entries(byDay)
    .map(([day, data]) => `${day.substring(0, 3)}: -${data.amount}${data.unit}`)
    .join(' | ');

  return `<div class="daily-breakdown hidden">${breakdown}</div>`;
}

/**
 * Save pantry data to JSON file
 * @param {Object} pantry - Pantry data
 * @param {string} outputPath - Output file path
 */
function savePantryJSON(pantry, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(pantry, null, 2), 'utf8');
  console.log(`✓ Saved pantry data to: ${outputPath}`);
}

/**
 * Load pantry data from JSON file
 * @param {string} inputPath - Input file path
 * @returns {Object} Pantry data or null
 */
function loadPantryJSON(inputPath) {
  if (!fs.existsSync(inputPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(inputPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading pantry JSON:', error.message);
    return null;
  }
}

module.exports = {
  generatePantryFromGroceryList,
  deductDailyUsage,
  formatPantryDisplay,
  savePantryJSON,
  loadPantryJSON,
  getEmojiForIngredient,
  parseIngredientQuantity,
  normalizeIngredientName
};
