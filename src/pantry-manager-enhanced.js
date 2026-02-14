/**
 * Enhanced Virtual Pantry Manager
 * Creates a human-curated shopping list that looks like a real person made it
 * - Merges duplicate ingredients intelligently
 * - Tracks daily usage from recipes
 * - Groups related items
 * - Provides shopping guidance
 */

const fs = require('fs');
const path = require('path');

// Russian ingredient normalization patterns
// Maps singular/plural and case variations to canonical form
const RUSSIAN_NORMALIZATIONS = {
  // Eggs
  'яйцо': 'яйца',
  'яйца': 'яйца',
  'яйц': 'яйца',
  
  // Meat
  'говядин': 'говядина',
  'говядина': 'говядина',
  'свинин': 'свинина',
  'свинина': 'свинина',
  'куриц': 'курица',
  'курица': 'курица',
  'куриное филе': 'куриное филе',
  'филе куриц': 'куриное филе',
  
  // Vegetables
  'лук': 'лук репчатый',
  'лук репчат': 'лук репчатый',
  'морков': 'морковь',
  'картофел': 'картофель',
  'картошка': 'картофель',
  'помидор': 'помидоры',
  'томат': 'помидоры',
  'чеснок': 'чеснок',
  'капуст': 'капуста',
  'огурец': 'огурцы',
  'огурц': 'огурцы',
  
  // Dairy
  'молок': 'молоко',
  'сметан': 'сметана',
  'творог': 'творог',
  'сыр': 'сыр',
  'сливочн': 'сливочное масло',
  'масло сливочн': 'сливочное масло',
  
  // Grains
  'рис': 'рис',
  'гречк': 'гречка',
  'гречнев': 'гречка',
  'макарон': 'макароны',
  'лапш': 'лапша',
  'хлопья': 'хлопья',
  'овсян': 'овсяные хлопья',
  
  // Oils & sauces
  'масло': 'масло',
  'соус': 'соус',
  'соевый соус': 'соевый соус',
  'масло растительн': 'масло растительное',
  'оливковое масл': 'оливковое масло',
  
  // Herbs & spices
  'зелень': 'зелень',
  'петрушк': 'петрушка',
  'укроп': 'укроп',
  'кинз': 'кинза',
  'базилик': 'базилик',
  
  // Seafood
  'креветк': 'креветки',
  'рыб': 'рыба',
  'лосос': 'лосось',
  
  // Fruits
  'яблок': 'яблоки',
  'банан': 'бананы',
  'апельсин': 'апельсины',
  'лимон': 'лимоны',
  'лайм': 'лайм'
};

// Common ingredient groupings for better organization
const INGREDIENT_GROUPS = {
  'Мясо и птица': ['говядин', 'свинин', 'куриц', 'мяс', 'бекон'],
  'Рыба и морепродукты': ['рыб', 'креветк', 'лосос', 'морепродукт'],
  'Молочные продукты': ['молок', 'сметан', 'творог', 'сыр', 'сливочн', 'яйц'],
  'Овощи': ['лук', 'морков', 'картофел', 'помидор', 'томат', 'чеснок', 'капуст', 'огурец', 'перец'],
  'Фрукты': ['яблок', 'банан', 'апельсин', 'лимон', 'лайм', 'ягода'],
  'Зелень и специи': ['зелень', 'петрушк', 'укроп', 'кинз', 'базилик', 'специи', 'перец', 'соль'],
  'Крупы и макароны': ['рис', 'гречк', 'макарон', 'лапш', 'хлопья', 'овсян'],
  'Масла и соусы': ['масло', 'соус', 'оливков', 'растительн'],
  'Прочее': []
};

// STAPLE INGREDIENTS TO HIDE
// These are assumed to be already in the kitchen - don't need to buy weekly
// NOTE: Be specific to avoid hiding fresh vegetables/fruits
const STAPLE_INGREDIENTS = [
  // Basic seasonings (exact matches or very specific)
  '^соль$',  // Just "соль" not "соль морская" or other variations
  '^сахар$',
  '^перец черный$',
  '^перец молотый$',
  'лавровый лист',
  '^уксус$',  // Just "уксус" not "уксус рисовый"
  'уксус 9%',
  'уксус столовый',
  
  // Basic oils (not specialty oils)
  '^масло растительное$',
  '^оливковое масло$',
  
  // Basic liquids
  '^вода$',
  
  // Basic pantry items (large quantities that last months)
  '^мука$',  // Just "мука" not "мука рисовая" or other specialty flours
  'мука пшеничная',
  'разрыхлитель',
  '^сода$',
];

// Emoji mapping for common ingredients
const INGREDIENT_EMOJIS = {
  'яйца': '🥚',
  'молоко': '🥛',
  'сыр': '🧀',
  'сливочное масло': '🧈',
  'творог': '🥛',
  'сметана': '🥛',
  'говядина': '🥩',
  'свинина': '🥓',
  'курица': '🐔',
  'куриное филе': '🍗',
  'рыба': '🐟',
  'креветки': '🦐',
  'лосось': '🐟',
  'лук': '🧅',
  'чеснок': '🧄',
  'картофель': '🥔',
  'морковь': '🥕',
  'помидоры': '🍅',
  'огурцы': '🥒',
  'капуста': '🥬',
  'зелень': '🌿',
  'рис': '🍚',
  'гречка': '🌾',
  'макароны': '🍝',
  'лапша': '🍜',
  'хлеб': '🍞',
  'яблоки': '🍎',
  'бананы': '🍌',
  'апельсины': '🍊',
  'лимоны': '🍋',
  'лайм': '🍋',
  'масло': '🫗',
  'соевый соус': '🥢'
};

const DEFAULT_EMOJI = '📦';

/**
 * Normalize Russian ingredient name to canonical form
 * Handles singular/plural and case variations
 */
function normalizeRussianIngredient(name) {
  if (!name || typeof name !== 'string') {
    return name;
  }

  const lower = name.toLowerCase().trim();

  // Try exact match first
  if (RUSSIAN_NORMALIZATIONS[lower]) {
    return RUSSIAN_NORMALIZATIONS[lower];
  }

  // Try partial match (for compound names like "куриное филе")
  for (const [pattern, canonical] of Object.entries(RUSSIAN_NORMALIZATIONS)) {
    if (lower.startsWith(pattern) || lower.includes(pattern)) {
      // For compound names, try to preserve the full name
      if (lower.includes('филе') && lower.includes('куриц')) {
        return 'куриное филе';
      }
      // Return the canonical form for simple matches
      if (!lower.includes(' ') && pattern.length > 3) {
        return canonical;
      }
    }
  }

  return name.trim();
}

/**
 * Get emoji for ingredient
 */
function getEmoji(ingredientName) {
  const normalized = normalizeRussianIngredient(ingredientName);
  return INGREDIENT_EMOJIS[normalized] || DEFAULT_EMOJI;
}

/**
 * Parse quantity string to extract value and unit
 */
function parseQuantity(quantityStr) {
  if (!quantityStr) return { value: 0, unit: '' };
  
  const str = String(quantityStr).trim();
  
  // Try to match number + unit pattern
  const match = str.match(/^([\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)\s*([a-zа-я\.]+)?/i);
  
  if (!match) return { value: 0, unit: str };
  
  let value = 0;
  const numStr = match[1];
  
  // Handle unicode fractions
  const fractions = {
    '½': 0.5, '⅓': 0.333, '⅔': 0.667, '¼': 0.25, '¾': 0.75,
    '⅕': 0.2, '⅛': 0.125, '⅐': 0.143, '⅑': 0.111, '⅒': 0.1
  };
  
  let current = '';
  for (const char of numStr) {
    if (fractions[char]) {
      if (current) value += parseFloat(current);
      current = '';
      value += fractions[char];
    } else if (/\d|\./.test(char)) {
      current += char;
    }
  }
  if (current) value += parseFloat(current);
  
  const unit = match[2] || '';
  
  return { value, unit };
}

/**
 * Combine two quantities intelligently
 */
function combineQuantities(qty1, qty2) {
  const p1 = parseQuantity(qty1);
  const p2 = parseQuantity(qty2);
  
  if (p1.unit === p2.unit && p1.unit) {
    const combined = p1.value + p2.value;
    const rounded = Math.round(combined * 10) / 10;
    return `${rounded} ${p1.unit}`;
  }
  
  // Incompatible units - return both
  if (p1.value === 0) return qty2;
  if (p2.value === 0) return qty1;
  return `${qty1} + ${qty2}`;
}

/**
 * Categorize ingredient into group
 */
function categorizeIngredient(ingredientName) {
  const lower = ingredientName.toLowerCase();
  
  for (const [group, keywords] of Object.entries(INGREDIENT_GROUPS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return group;
      }
    }
  }
  
  return 'Прочее';
}

/**
 * Check if ingredient should be hidden (staple item already in kitchen)
 */
function shouldHideStaple(ingredientName, quantity) {
  const lower = ingredientName.toLowerCase().trim();
  
  // NEVER hide fresh vegetables/fruits/meat/dairy - always need to buy
  const neverHide = [
    'фасоль', 'горох', 'бобы',  // Fresh legumes (NOT dried/canned)
    'спарж',  // Asparagus
    'орех',   // Nuts
    'масло сливочн',  // Butter (always need to buy)
    'сыр',    // Cheese
    'молоко', // Milk
    'яйц',    // Eggs
    'мяс',    // Meat
    'рыб',    // Fish
    'овощ',   // Vegetables
    'фрукт',  // Fruits
  ];
  
  for (const keyword of neverHide) {
    if (lower.includes(keyword)) {
      return false;  // Don't hide fresh items
    }
  }
  
  // Check if it's a staple ingredient (pantry basics)
  // Use regex matching for more precise control
  for (const staple of STAPLE_INGREDIENTS) {
    try {
      // If staple starts with ^ or ends with $, use as regex
      if (staple.startsWith('^') || staple.endsWith('$')) {
        const regex = new RegExp(staple, 'i');
        if (regex.test(lower)) {
          return true;
        }
      } else {
        // Otherwise use simple includes
        if (lower.includes(staple)) {
          return true;
        }
      }
    } catch (e) {
      // If regex fails, fall back to simple includes
      if (lower.includes(staple)) {
        return true;
      }
    }
  }
  
  // Hide "to taste" or "pinch" quantities
  if (lower.includes('по вкусу') || lower.includes('щепотка')) {
    return true;
  }
  
  return false;
}

/**
 * Generate smart, human-curated pantry from grocery list and menu
 * This is the main function that creates a shopping-friendly view
 */
function generatePantryFromGroceryList(groceryList, menu) {
  console.log('\n🛒 Generating human-curated shopping list...\n');

  const pantryItems = {};
  const usageTracking = {};

  // Step 1: Collect all ingredients from grocery list and normalize
  console.log('  Step 1: Collecting and normalizing ingredients...');
  
  let hiddenStaplesCount = 0;
  
  for (const [category, items] of Object.entries(groceryList)) {
    if (!Array.isArray(items)) continue;
    
    for (const item of items) {
      const itemName = item.name || item.item || '';
      if (!itemName) continue;
      
      const normalized = normalizeRussianIngredient(itemName);
      const parsed = parseQuantity(item.quantity);
      
      // Skip items with no quantity
      if (parsed.value === 0 && !item.quantity?.includes('N/A')) {
        continue;
      }
      
      // HIDE STAPLES - Don't add to shopping list
      if (shouldHideStaple(normalized, item.quantity)) {
        hiddenStaplesCount++;
        console.log(`    🏠 Hiding staple: ${normalized} (${item.quantity})`);
        continue;
      }
      
      // Merge duplicates
      if (pantryItems[normalized]) {
        // Combine quantities
        pantryItems[normalized].totalQuantity = combineQuantities(
          pantryItems[normalized].totalQuantity,
          item.quantity
        );
        // Merge usedIn arrays
        if (item.usedIn && Array.isArray(item.usedIn)) {
          pantryItems[normalized].usedIn.push(...item.usedIn);
        }
      } else {
        pantryItems[normalized] = {
          name: normalized,
          originalNames: [itemName],
          totalQuantity: item.quantity,
          emoji: getEmoji(normalized),
          category: categorizeIngredient(normalized),
          usedIn: item.usedIn || [],
          dailyUsage: {}
        };
      }
    }
  }
  
  console.log(`    ✓ Collected ${Object.keys(pantryItems).length} unique ingredients`);
  if (hiddenStaplesCount > 0) {
    console.log(`    🏠 Hidden ${hiddenStaplesCount} staple items (already in kitchen)\n`);
  } else {
    console.log();
  }

  // Step 2: Track daily usage from menu recipes
  console.log('  Step 2: Tracking daily usage from recipes...');
  
  const days = Object.keys(menu);
  let matchedIngredients = 0;
  
  for (const day of days) {
    for (const [mealType, mealData] of Object.entries(menu[day])) {
      if (!mealData.recipe || !mealData.recipe.ingredients) continue;
      
      for (const ingredient of mealData.recipe.ingredients) {
        // Handle both string and object formats
        let ingredientText, quantity;
        if (typeof ingredient === 'string') {
          ingredientText = ingredient;
          quantity = '';
        } else if (typeof ingredient === 'object' && ingredient.item) {
          ingredientText = ingredient.item;
          quantity = ingredient.quantity || '';
        } else {
          continue;
        }
        
        const normalized = normalizeRussianIngredient(ingredientText);
        
        // Try to find this ingredient in our pantry
        let matched = null;
        for (const [key, value] of Object.entries(pantryItems)) {
          if (key === normalized || 
              key.includes(normalized) || 
              normalized.includes(key)) {
            matched = key;
            break;
          }
        }
        
        if (matched) {
          matchedIngredients++;
          
          // Track usage by day
          if (!pantryItems[matched].dailyUsage[day]) {
            pantryItems[matched].dailyUsage[day] = {
              meals: [],
              totalQuantity: ''
            };
          }
          
          pantryItems[matched].dailyUsage[day].meals.push({
            mealType,
            mealName: mealData.name,
            quantity: quantity || 'as needed'
          });
        }
      }
    }
  }
  
  console.log(`    ✓ Matched ${matchedIngredients} ingredient usages\n`);

  // Step 3: Organize by category for human-friendly display
  console.log('  Step 3: Organizing by category...');
  
  const categorized = {};
  
  for (const [key, item] of Object.entries(pantryItems)) {
    const category = item.category;
    
    if (!categorized[category]) {
      categorized[category] = {};
    }
    
    categorized[category][key] = {
      emoji: item.emoji,
      name: item.name,
      quantity: item.totalQuantity,
      usedIn: item.usedIn,
      dailyUsage: item.dailyUsage,
      shoppingNote: generateShoppingNote(item)
    };
  }
  
  console.log(`    ✓ Organized into ${Object.keys(categorized).length} categories\n`);

  // Step 4: Generate shopping guidance
  const shoppingGuidance = generateShoppingGuidance(pantryItems);
  
  console.log('✓ Shopping list ready!\n');

  return {
    categorized,
    shoppingGuidance,
    summary: {
      totalItems: Object.keys(pantryItems).length,
      categories: Object.keys(categorized).length,
      matchedUsage: matchedIngredients
    }
  };
}

/**
 * Generate a helpful shopping note for an item
 */
function generateShoppingNote(item) {
  const usageDays = Object.keys(item.dailyUsage);
  
  if (usageDays.length === 0) {
    return '';
  }
  
  if (usageDays.length === 1) {
    return `Для ${usageDays[0]}`;
  }
  
  if (usageDays.length <= 3) {
    return `Для ${usageDays.join(', ')}`;
  }
  
  return `Для ${usageDays.length} дней`;
}

/**
 * Generate overall shopping guidance
 */
function generateShoppingGuidance(pantryItems) {
  const guidance = {
    priority: [],
    tips: [],
    estimatedCost: 0
  };
  
  // Find items with high usage (used in multiple meals)
  for (const [key, item] of Object.entries(pantryItems)) {
    const usageDays = Object.keys(item.dailyUsage);
    
    if (usageDays.length >= 4) {
      guidance.priority.push({
        item: item.name,
        reason: `Используется в ${usageDays.length} днях`
      });
    }
  }
  
  // Add general shopping tips
  if (guidance.priority.length > 0) {
    guidance.tips.push('💡 Сначала купите товары с высоким приоритетом - они нужны чаще всего');
  }
  
  // Estimate total cost (rough)
  const categories = {};
  for (const [key, item] of Object.entries(pantryItems)) {
    if (!categories[item.category]) {
      categories[item.category] = 0;
    }
    categories[item.category]++;
  }
  
  guidance.categoryBreakdown = categories;
  
  return guidance;
}

/**
 * Format pantry for HTML display
 */
function formatPantryHTML(pantryData) {
  const { categorized, shoppingGuidance } = pantryData;
  
  let html = '<div class="pantry-container">\n';
  
  // Shopping guidance
  if (shoppingGuidance.priority.length > 0) {
    html += '<div class="shopping-guidance">\n';
    html += '<h3>🎯 Приоритетные покупки</h3>\n';
    html += '<ul>\n';
    for (const p of shoppingGuidance.priority.slice(0, 5)) {
      html += `<li><strong>${p.item}</strong> - ${p.reason}</li>\n`;
    }
    html += '</ul>\n';
    html += '</div>\n\n';
  }
  
  // Categories
  for (const [category, items] of Object.entries(categorized)) {
    html += `<div class="pantry-category">\n`;
    html += `<h3>${category}</h3>\n`;
    html += '<ul class="pantry-items">\n';
    
    for (const [key, item] of Object.entries(items)) {
      const note = item.shoppingNote ? `<span class="note">${item.shoppingNote}</span>` : '';
      html += `<li class="pantry-item">\n`;
      html += `  <span class="emoji">${item.emoji}</span>\n`;
      html += `  <span class="name">${item.name}</span>\n`;
      html += `  <span class="quantity">${item.quantity}</span>\n`;
      html += `  ${note}\n`;
      html += `</li>\n`;
    }
    
    html += '</ul>\n';
    html += '</div>\n\n';
  }
  
  html += '</div>\n';
  
  return html;
}

/**
 * Save pantry data to JSON
 */
function savePantryJSON(pantryData, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(pantryData, null, 2), 'utf8');
  console.log(`✓ Saved pantry data to: ${outputPath}`);
}

/**
 * Load pantry data from JSON
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
  formatPantryHTML,
  savePantryJSON,
  loadPantryJSON,
  normalizeRussianIngredient,
  getEmoji,
  parseQuantity,
  combineQuantities,
  categorizeIngredient,
  shouldHideStaple
};
