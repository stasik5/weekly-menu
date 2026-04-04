const recipes = require('./data/recipes-2026-04-04.json');

// Aggregate all ingredients
const groceryMap = {};

for (const recipe of recipes.recipes) {
  for (const ing of recipe.ingredients) {
    const key = ing.item.toLowerCase().trim();
    if (!groceryMap[key]) {
      groceryMap[key] = { item: ing.item, amounts: [], totalAmount: 0, unit: ing.unit, category: categorize(ing.item) };
    }
    groceryMap[key].amounts.push({ amount: ing.amount, unit: ing.unit, recipe: recipe.name });
    // Convert to common unit
    groceryMap[key].totalAmount += normalizeAmount(ing.amount, ing.unit);
    groceryMap[key].unit = normalizeUnit(ing.unit);
  }
}

function normalizeAmount(amount, unit) {
  if (unit === 'g' || unit === 'ml') return amount;
  if (unit === 'pcs') return amount;
  if (unit === 'cloves') return amount; // keep as cloves
  if (unit === 'stalks') return amount;
  return amount;
}

function normalizeUnit(unit) {
  if (['g', 'ml', 'L', 'kg'].includes(unit)) return unit;
  return unit;
}

function categorize(item) {
  const lower = item.toLowerCase();
  if (/beef|pork|chicken|meat|sausage|ham|shrimp|salmon|belly/.test(lower)) return 'Meat & Seafood';
  if (/egg/.test(lower)) return 'Dairy & Eggs';
  if (/milk|cheese|cottage|sour cream|kefir|butter|yogurt|tofu/.test(lower)) return 'Dairy & Eggs';
  if (/flour|sugar|baking|breadcrumbs|cornstarch/.test(lower)) return 'Pantry - Baking';
  if (/rice|noodle|buckwheat|pasta|egg noodles/.test(lower)) return 'Grains & Pasta';
  if (/oil|vinegar|soy sauce|fish sauce|sesame|miso|dashi|mirin|gochujang|tamarind|curry roux/.test(lower)) return 'Condiments & Sauces';
  if (/salt|pepper|bay leaf|chili/.test(lower)) return 'Spices';
  if (/garlic|onion|ginger|lemongrass|galangal/.test(lower)) return 'Aromatics';
  if (/potato|carrot|beet|cabbage|mushroom|broccoli|spinach|zucchini|tomato|cucumber|sprout/.test(lower)) return 'Vegetables';
  if (/lime|lemon|pomegranate/.test(lower)) return 'Fruits';
  if (/peanut|sesame seed|nori|wakame|capers|olive/.test(lower)) return 'Nuts & Specialty';
  if (/dill|cilantro|green onion|kaffir/.test(lower)) return 'Fresh Herbs';
  if (/jam|honey|pickle|bean/.test(lower)) return 'Pantry - Other';
  return 'Other';
}

const categories = {};
for (const item of Object.values(groceryMap)) {
  if (!categories[item.category]) categories[item.category] = [];
  categories[item.category].push(item);
}

// Sort categories
const sortedCategories = Object.keys(categories).sort();

const groceryList = {
  weekOf: "2026-04-06",
  generated: new Date().toISOString(),
  categories: {}
};

let totalItems = 0;
for (const cat of sortedCategories) {
  groceryList.categories[cat] = categories[cat].map(item => ({
    item: item.item,
    totalAmount: Math.round(item.totalAmount * 10) / 10,
    unit: item.unit,
    usedIn: item.amounts.map(a => `${a.recipe} (${a.amount} ${a.unit})`)
  }));
  totalItems += categories[cat].length;
}

groceryList.totalUniqueItems = totalItems;

require('fs').writeFileSync('./data/grocery-list-2026-04-04.json', JSON.stringify(groceryList, null, 2));
console.log(`Grocery list: ${totalItems} unique items across ${sortedCategories.length} categories`);
