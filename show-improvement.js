#!/usr/bin/env node
/**
 * Show comparison between old and new pantry systems
 */

const fs = require('fs');
const path = require('path');

const weekFolder = '2026-W06';
const inputDir = path.join(__dirname, 'output', 'weekly', weekFolder);

console.log('='.repeat(70));
console.log('PANTRY SYSTEM COMPARISON');
console.log('='.repeat(70));
console.log(`Week: ${weekFolder}\n`);

// Load old pantry
const oldPantry = JSON.parse(fs.readFileSync(path.join(inputDir, 'pantry-old-backup.json'), 'utf8'));
const newPantry = JSON.parse(fs.readFileSync(path.join(inputDir, 'pantry-enhanced.json'), 'utf8'));

console.log('BEFORE (Old System):');
console.log('-'.repeat(70));
console.log(`Total items: ${Object.keys(oldPantry).length}`);
console.log(`Organization: Flat list with no categorization\n`);

// Show eggs example (OLD)
console.log('Eggs Example (OLD):');
const oldEggs = Object.entries(oldPantry).filter(([k]) => k.includes('яйц'));
oldEggs.forEach(([key, item]) => {
  console.log(`  - ${item.name}: ${item.total}${item.unit}`);
  console.log(`    Daily usage tracked: ${item.dailyUsage.length > 0 ? 'Yes' : 'No'}`);
});
console.log();

console.log('AFTER (Enhanced System):');
console.log('-'.repeat(70));
console.log(`Total items: ${newPantry.summary.totalItems}`);
console.log(`Categories: ${newPantry.summary.categories}`);
console.log(`Usage tracking: ${newPantry.summary.matchedUsage} ingredient usages matched\n`);

// Show eggs example (NEW)
console.log('Eggs Example (NEW):');
const newEggs = Object.entries(newPantry.categorized['Молочные продукты'])
  .filter(([k]) => k.includes('яйц'));

newEggs.forEach(([key, item]) => {
  console.log(`  - ${item.emoji} ${item.name}: ${item.quantity}`);
  console.log(`    Used in: ${Object.keys(item.dailyUsage).length} days`);
  console.log(`    Shopping note: "${item.shoppingNote}"`);
  console.log(`    Meals:`);
  
  for (const [day, data] of Object.entries(item.dailyUsage)) {
    const mealNames = data.meals.map(m => m.mealName).join(', ');
    console.log(`      ${day}: ${mealNames}`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('KEY IMPROVEMENTS');
console.log('='.repeat(70));

console.log(`
✅ SMART MERGING
   - Eggs now appear as ONE entry (20 шт) instead of TWO separate entries
   - Automatically handles singular/plural variations (яйцо → яйца)

✅ HUMAN-CURATED ORGANIZATION
   - Items grouped by category (Meat, Dairy, Vegetables, etc.)
   - Shopping notes like "Для 6 дней" (For 6 days)
   - Priority items highlighted (used in multiple days)

✅ DETAILED USAGE TRACKING
   - See exactly which meals use each ingredient
   - Know when you'll need each item during the week
   - Better planning for grocery shopping

✅ SHOPPING GUIDANCE
   - Priority items identified automatically
   - Items used in 4+ days highlighted for focus
   - Better shopping experience at the store
`);

console.log('Files updated:');
console.log(`  - ${path.join(inputDir, 'pantry-enhanced.json')}`);
console.log(`  - ${path.join(inputDir, 'pantry.json')}`);
console.log(`  - ${path.join(inputDir, 'index.html')}\n`);
