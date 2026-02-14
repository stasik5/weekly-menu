#!/usr/bin/env node
/**
 * Test script for enhanced pantry manager
 * Runs on existing grocery list and menu data
 */

const fs = require('fs');
const path = require('path');
const enhancedPantry = require('./src/pantry-manager-enhanced');

const outputDir = path.join(__dirname, 'output', 'weekly', '2026-W06');

// Load existing data
console.log('Loading existing data...\n');

const groceryList = JSON.parse(fs.readFileSync(path.join(outputDir, 'grocery-list.json'), 'utf8'));
const menu = JSON.parse(fs.readFileSync(path.join(outputDir, 'recipes.json'), 'utf8'));

console.log('Grocery list categories:', Object.keys(groceryList.categories || groceryList));
console.log('Menu days:', Object.keys(menu).slice(0, 3), '...\n');

// Generate enhanced pantry
console.log('Generating enhanced pantry...\n');

const pantryData = enhancedPantry.generatePantryFromGroceryList(
  groceryList.categories || groceryList,
  menu
);

// Save results
const outputPath = path.join(outputDir, 'pantry-enhanced.json');
enhancedPantry.savePantryJSON(pantryData, outputPath);

// Show summary
console.log('\n=== SUMMARY ===\n');
console.log('Total unique items:', pantryData.summary.totalItems);
console.log('Categories:', pantryData.summary.categories);
console.log('Matched usage:', pantryData.summary.matchedUsage);

console.log('\n=== SAMPLE OUTPUT ===\n');

// Show some examples
const categories = Object.keys(pantryData.categorized);
console.log('Categories:', categories.join(', '));

// Show eggs specifically
console.log('\n--- Eggs Example ---');
for (const [category, items] of Object.entries(pantryData.categorized)) {
  for (const [key, item] of Object.entries(items)) {
    if (key.includes('яйц')) {
      console.log(JSON.stringify(item, null, 2));
    }
  }
}

// Show priority items
if (pantryData.shoppingGuidance.priority.length > 0) {
  console.log('\n--- Priority Items ---');
  pantryData.shoppingGuidance.priority.forEach(p => {
    console.log(`  • ${p.item}: ${p.reason}`);
  });
}

console.log('\n✓ Test complete!\n');
