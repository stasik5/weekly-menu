/**
 * Test script to verify pantry manager filtering fix
 */

const pantryManager = require('./src/pantry-manager');

// Test grocery list with real ingredients in various formats
const testGroceryList = {
  meat: [
    { item: "Chicken Breast", quantity: "1.9kg", notes: "For various recipes" },
    { item: "Beef Sirloin", quantity: "500g", notes: "For dinner" },
    { item: "Ground Pork", quantity: "200g", notes: "For dumplings" }
  ],
  dairy: [
    { item: "Farmer's Cheese", quantity: "700g", notes: "For pancakes" },
    { item: "Sour Cream", quantity: "1.6kg", notes: "For soups" },
    { item: "Butter", quantity: "300g", notes: "For cooking" }
  ],
  vegetables: [
    { item: "Onions", quantity: "10", notes: "Yellow, various recipes" },
    { item: "Garlic", quantity: "2 heads", notes: "Fresh" },
    { item: "Tomatoes", quantity: "4 medium", notes: "Fresh" },
    { item: "Carrots", quantity: "1.2kg", notes: "For soups" }
  ],
  other: [
    { item: "Eggs", quantity: "30", notes: "Large" },
    { item: "Water", quantity: "N/A", notes: "Tap water" },
    { item: "Vegetable Oil", quantity: "Need to stock", notes: "For cooking" }
  ]
};

// Test menu with fallback templates (simulating no web_search)
const testMenu = {
  Monday: {
    breakfast: {
      name: "Test Meal",
      cuisine: "test",
      targetCalories: 500,
      recipe: {
        title: "Test Meal",
        ingredients: [
          "Main ingredients vary by recipe",
          "Seasonings to taste",
          "Cook according to recipe instructions"
        ],
        nutrition: { calories: 500, protein: 20, carbs: 50, fat: 20 },
        source: "fallback_template"
      }
    },
    snack: { name: "Test Snack", cuisine: "test", targetCalories: 200, recipe: null },
    dinner: { name: "Test Dinner", cuisine: "test", targetCalories: 800, recipe: null }
  }
};

console.log('Testing pantry manager with real ingredients...\n');

const pantry = pantryManager.generatePantryFromGroceryList(testGroceryList, testMenu);

console.log('\n✅ Pantry generated successfully!\n');
console.log('Pantry items:');
for (const [key, item] of Object.entries(pantry)) {
  console.log(`  ${item.emoji} ${item.name}: ${item.total}${item.unit}`);
}

console.log(`\n✓ Total pantry items: ${Object.keys(pantry).length}`);

// Expected items should include:
// - Chicken Breast (1.9kg)
// - Beef Sirloin (500g)
// - Ground Pork (200g)
// - Farmer's Cheese (700g)
// - Sour Cream (1.6kg)
// - Butter (300g)
// - Onions (10)
// - Garlic (2)
// - Tomatoes (4)
// - Carrots (1.2)
// - Eggs (30)

// Should NOT include:
// - Water (N/A)
// - Vegetable Oil (Need to stock)

const expectedItems = 11;
if (Object.keys(pantry).length === expectedItems) {
  console.log(`✅ PASS: Expected ${expectedItems} items, got ${Object.keys(pantry).length}`);
} else {
  console.log(`❌ FAIL: Expected ${expectedItems} items, got ${Object.keys(pantry).length}`);
}
