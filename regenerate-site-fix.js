/**
 * Quick regeneration script for 2026-W07 with bug fixes
 */

const fs = require('fs');
const path = require('path');

// Load modules
const pantryManagerEnhanced = require('./src/pantry-manager-enhanced');
const siteGenerator = require('./src/site-generator');
const groceryListBuilder = require('./src/grocery-list-builder');
const publisher = require('./src/publisher');

async function regenerate() {
  console.log('🔧 Regenerating site with bug fixes...\n');

  // Load existing menu data
  const normalizedPlan = JSON.parse(fs.readFileSync('./output/weekly/2026-W07/recipes.json', 'utf8'));

  console.log(`✓ Loaded ${Object.keys(normalizedPlan).length} days of menu\n`);

  // Rebuild grocery list from recipes (to ensure correct format)
  console.log('🛒 Building grocery list...');
  const groceryList = groceryListBuilder.buildGroceryList(normalizedPlan);
  const totalItems = Object.values(groceryList).reduce((s, i) => s + i.length, 0);
  console.log(`✓ Built grocery list with ${totalItems} items\n`);

  // Generate pantry data
  console.log('📦 Generating virtual pantry...');
  const pantryData = pantryManagerEnhanced.generatePantryFromGroceryList(groceryList, normalizedPlan);
  console.log(`✓ Virtual pantry created with ${pantryData.summary.totalItems} items\n`);

  // Flatten categorized pantry for formatPantryDisplay
  const flatPantry = {};
  for (const [category, items] of Object.entries(pantryData.categorized)) {
    for (const [key, item] of Object.entries(items)) {
      const qtyMatch = item.quantity?.match(/^([\d.]+)/);
      const totalValue = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      flatPantry[key] = {
        emoji: item.emoji,
        name: item.name,
        normalizedName: key,
        total: totalValue,
        unit: item.quantity?.replace(/^[\d.]+\s*/, '') || '',
        remaining: totalValue,
        dailyUsage: (item.usedIn || []).map(u => ({
          day: u.day,
          mealType: u.mealType,
          meal: u.cuisine || ''
        }))
      };
    }
  }

  // Generate HTML
  console.log('🌐 Generating HTML...');
  const weekLabel = '2026-W07';
  const html = siteGenerator.generateHTML(normalizedPlan, groceryList, flatPantry, weekLabel);
  console.log(`✓ HTML generated\n`);

  // Save files
  const htmlPath = './output/weekly/2026-W07/index.html';
  const docsPath = './docs/index.html';

  fs.writeFileSync(htmlPath, html);
  console.log(`✓ Saved: ${htmlPath}`);

  // Copy to docs
  const docsDir = path.dirname(docsPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.copyFileSync(htmlPath, docsPath);
  console.log(`✓ Copied to: ${docsPath}\n`);

  // Publish to GitHub
  console.log('📤 Publishing to GitHub...');
  const result = await publisher.publishToGitHub(htmlPath, weekLabel);

  if (result.success) {
    console.log('✅ Published successfully!');
    console.log(`   https://stasik5.github.io/weekly-menu/\n`);
  } else {
    console.error('❌ Publishing failed:', result.error, '\n');
  }

  return result;
}

regenerate()
  .then(() => {
    console.log('✅ Regeneration complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
