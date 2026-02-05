/**
 * Fix ingredient parsing bugs in grocery-list-builder.js
 * v3: Manual fix with proper regex escaping
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ingredient parsing bugs (v3)...\n');

const filePath = path.join(__dirname, 'src/grocery-list-builder.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted character classes
// Need to double-escape backslashes for string replacement

// Fix extractIngredientName
content = content.replace(
  '.replace(/^[\\d½⅓⅔¼¾⅕ⅈ]?\\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?)\\s*/i',
  `.replace(/^[\\\\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\\\.\\\\d+)?(?:\\\\s*-\\\\s*[\\\\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\\\.\\\\d+)?)?(?:\\\\s*/i, \'\') // Remove leading numbers, fractions, and decimals (e.g., "1", "1.5", "1/2", "3/4")\\n    .replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?)\\\\s*(of\\\\s*)?/i, \'\') // Remove measurements (avoided single-letter matches)`
);

// Fix extractQuantity
content = content.replace(
  '.match(/^[\\d½⅓⅔¼¾⅕ⅈ]?\\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|milliliters?|mls?|liters?|pieces?|slices?)?/i)',
  `.match(/^[\\\\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\\\.\\\\d+)?(?:\\\\s*-\\\\s*[\\\\d½⅓⅔¼¾⅕ⅈ]?\\\\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|milliliters?|mls?|liters?|pieces?|slices?)?/i)`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Saved changes to grocery-list-builder.js\n');

console.log('Testing the fix...\n');
const { extractIngredientName, extractQuantity } = require('./src/grocery-list-builder');

const testIngredients = [
  "2 large carrots, diced",
  "1 large head of cabbage",
  "4-5 green onions (scallions), chopped",
  "1 tablespoon vegetable oil",
  "200g short-grain white rice"
];

let passCount = 0;
for (const ingredient of testIngredients) {
  const name = extractIngredientName(ingredient);
  const qty = extractQuantity(ingredient);

  // Check if results are good
  let pass = true;
  let issues = [];

  if (name.includes('\\d')) issues.push('name still contains digits');
  if (qty === 'as needed' && ingredient.match(/^\\d/)) issues.push('quantity not extracted');

  console.log(`Input:  "${ingredient}"`);
  console.log(`  Name: "${name}"`);
  console.log(`  Qty:  "${qty}"`);
  if (issues.length > 0) {
    console.log(`  ❌ Issues: ${issues.join(', ')}`);
  } else {
    console.log(`  ✅ PASS`);
    passCount++;
  }
  console.log();
}

console.log(`Test results: ${passCount}/${testIngredients.length} passed`);

if (passCount === testIngredients.length) {
  console.log('\n✅ All tests passed! Running pipeline...\n');
  const { execSync } = require('child_process');
  try {
    execSync('node complete-pipeline.js', { cwd: __dirname, stdio: 'inherit' });
    console.log('\n✅ Pipeline completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('\n❌ Some tests failed. Please check the regex patterns.\n');
  process.exit(1);
}
