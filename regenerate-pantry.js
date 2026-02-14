#!/usr/bin/env node
/**
 * Regenerate pantry for current week with enhanced system
 * This script takes existing grocery list and menu data and regenerates
 * the pantry using the enhanced pantry manager
 */

const fs = require('fs');
const path = require('path');
const enhancedPantry = require('./src/pantry-manager-enhanced');
const siteGenerator = require('./src/site-generator');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node regenerate-pantry.js <week-folder>');
  console.error('Example: node regenerate-pantry.js 2026-W06');
  process.exit(1);
}

const weekFolder = args[0];
const inputDir = path.join(__dirname, 'output', 'weekly', weekFolder);

if (!fs.existsSync(inputDir)) {
  console.error(`Error: Week folder not found: ${inputDir}`);
  process.exit(1);
}

console.log('='.repeat(60));
console.log('REGENERATING PANTRY WITH ENHANCED SYSTEM');
console.log('='.repeat(60));
console.log(`Week: ${weekFolder}`);
console.log(`Input: ${inputDir}\n`);

// Load existing data
console.log('Loading existing data...');
const groceryList = JSON.parse(fs.readFileSync(path.join(inputDir, 'grocery-list.json'), 'utf8'));
const menu = JSON.parse(fs.readFileSync(path.join(inputDir, 'recipes.json'), 'utf8'));

console.log('✓ Grocery list loaded');
console.log('✓ Menu loaded\n');

// Generate enhanced pantry
console.log('Generating enhanced pantry...\n');

const groceryCategories = groceryList.categories || groceryList;
const pantryData = enhancedPantry.generatePantryFromGroceryList(groceryCategories, menu);

// Save enhanced pantry
const pantryPath = path.join(inputDir, 'pantry-enhanced.json');
enhancedPantry.savePantryJSON(pantryData, pantryPath);

// Also save as pantry.json (overwrite old one with backup)
const oldPantryPath = path.join(inputDir, 'pantry.json');
if (fs.existsSync(oldPantryPath)) {
  const backupPath = path.join(inputDir, 'pantry-old-backup.json');
  fs.copyFileSync(oldPantryPath, backupPath);
  console.log(`✓ Backed up old pantry to: pantry-old-backup.json`);
}

// Convert enhanced format to flat format for site generator compatibility
const flatPantry = {};
for (const [category, items] of Object.entries(pantryData.categorized)) {
  for (const [key, item] of Object.entries(items)) {
    // Parse quantity to get numeric value and unit
    const qtyMatch = item.quantity.match(/^([\d.]+)\s*(.+)?$/);
    const totalValue = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
    const unit = qtyMatch && qtyMatch[2] ? qtyMatch[2] : 'шт';
    
    flatPantry[key] = {
      emoji: item.emoji,
      name: item.name,
      normalizedName: key,
      total: totalValue,
      unit: unit,
      remaining: totalValue,
      dailyUsage: Object.entries(item.dailyUsage).map(([day, data]) => ({
        day,
        amount: data.meals.length,
        unit: unit,
        meal: data.meals[0]?.mealName || ''
      }))
    };
  }
}

fs.writeFileSync(oldPantryPath, JSON.stringify(flatPantry, null, 2), 'utf8');
console.log(`✓ Updated pantry.json with enhanced data\n`);

// Regenerate HTML
console.log('Regenerating HTML...');
const weekLabel = weekFolder;
const groceryListData = groceryList;
const normalizedPlan = menu;

const html = siteGenerator.generateHTML(normalizedPlan, groceryListData, flatPantry, weekLabel);
const htmlPath = path.join(inputDir, 'index.html');
fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`✓ Updated HTML\n`);

// Summary
console.log('='.repeat(60));
console.log('REGENERATION COMPLETE');
console.log('='.repeat(60));
console.log(`Total items: ${pantryData.summary.totalItems}`);
console.log(`Categories: ${pantryData.summary.categories}`);
console.log(`Matched usage: ${pantryData.summary.matchedUsage}\n`);

console.log('Priority items:');
pantryData.shoppingGuidance.priority.slice(0, 5).forEach(p => {
  console.log(`  • ${p.item}: ${p.reason}`);
});

console.log(`\n✓ Files updated in: ${inputDir}`);
console.log(`  - pantry-enhanced.json (new enhanced format)`);
console.log(`  - pantry.json (updated flat format for site generator)`);
console.log(`  - index.html (regenerated)\n`);
