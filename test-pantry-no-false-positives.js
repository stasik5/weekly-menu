/**
 * Test script to verify pantry manager doesn't filter legitimate ingredients
 * that contain words like "for", "dough", "filling", etc.
 */

const pantryManager = require('./src/pantry-manager');

// Test grocery list with ingredients that might trigger false positives
const testGroceryList = {
  dough: [
    { item: "Flour for dough", quantity: "2kg", notes: "For making dough" },
    { item: "Yeast for dough", quantity: "50g", notes: "For rising" }
  ],
  filling: [
    { item: "Cheese for filling", quantity: "400g", notes: "For dumplings" },
    { item: "Meat filling", quantity: "500g", notes: "Ground beef" }
  ],
  pantry: [
    { item: "onion", quantity: "3", notes: "For cooking" },
    { item: "garlic", quantity: "1 head", notes: "Fresh" },
    { item: "milk", quantity: "500ml", notes: "For recipes" },
    { item: "oil", quantity: "300ml", notes: "Vegetable oil" }
  ],
  generic: [
    { item: "Seasonings to taste", quantity: "N/A", notes: "Generic" },
    { item: "Main ingredients vary by recipe", quantity: "N/A", notes: "Generic" },
    { item: "Cook according to recipe instructions", quantity: "N/A", notes: "Generic" },
    { item: "for dough", quantity: "N/A", notes: "Instruction only" },
    { item: "for filling", quantity: "N/A", notes: "Instruction only" },
    { item: "note: optional", quantity: "N/A", notes: "Instruction only" }
  ]
};

const testMenu = {
  Monday: {
    breakfast: { name: "Test", cuisine: "test", targetCalories: 500, recipe: null }
  }
};

console.log('Testing pantry manager with potentially problematic ingredient names...\n');

const pantry = pantryManager.generatePantryFromGroceryList(testGroceryList, testMenu);

console.log('\n✅ Pantry generated successfully!\n');
console.log('Pantry items:');
for (const [key, item] of Object.entries(pantry)) {
  console.log(`  ${item.emoji} ${item.name}: ${item.total}${item.unit}`);
}

console.log(`\n✓ Total pantry items: ${Object.keys(pantry).length}`);

// Expected items:
// - Flour for dough (2kg) - should be included (has quantity)
// - Yeast for dough (50g) - should be included (has quantity)
// - Cheese for filling (400g) - should be included (has quantity)
// - Meat filling (500g) - should be included (has quantity)
// - onion (3) - should be included
// - garlic (1 head) - should be included
// - milk (500ml) - should be included
// - oil (300ml) - should be included

// Should NOT include:
// - Seasonings to taste (N/A, matches skip pattern)
// - Main ingredients vary by recipe (matches skip pattern)
// - Cook according to recipe instructions (matches skip pattern)
// - for dough (exact match, N/A)
// - for filling (exact match, N/A)
// - note: optional (exact match, N/A)

const expectedItems = 8;
if (Object.keys(pantry).length === expectedItems) {
  console.log(`\n✅ PASS: Expected ${expectedItems} items, got ${Object.keys(pantry).length}`);

  // Verify specific items are present
  const itemNames = Object.values(pantry).map(item => item.name.toLowerCase());

  const requiredItems = [
    'flour for dough',
    'yeast for dough',
    'cheese for filling',
    'meat filling',
    'onion',
    'garlic',
    'milk',
    'oil'
  ];

  let allPresent = true;
  for (const req of requiredItems) {
    if (!itemNames.some(name => name.includes(req))) {
      console.log(`❌ FAIL: Missing required item: ${req}`);
      allPresent = false;
    }
  }

  if (allPresent) {
    console.log(`✅ PASS: All required items are present`);
  }
} else {
  console.log(`\n❌ FAIL: Expected ${expectedItems} items, got ${Object.keys(pantry).length}`);
}
