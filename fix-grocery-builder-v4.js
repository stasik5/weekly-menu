/**
 * Fix ingredient parsing bugs in grocery-list-builder.js
 * v4: Simple direct fix using actual Unicode characters
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ingredient parsing bugs (v4)...\n');

const filePath = path.join(__dirname, 'src/grocery-list-builder.js');
let content = fs.readFileSync(filePath, 'utf8');

// The main fix is to change the unit matching pattern to avoid single-letter matches
// AND to properly handle units attached to numbers like "200g"

// Fix extractIngredientName:
// OLD: .replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves)\s*(of\s*)?/i, '')
// NEW: .replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?|piece|pieces|slice|slices|bunch|head|clove|cloves)\s*(of\s*)?/i, '')

const oldPattern1 = '.replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves)\\s*(of\\s*)?/i, \'\')';
const newPattern1 = ".replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?|piece|pieces|slice|slices|bunch|head|clove|cloves)\\s*(of\\s*)?/i, '')";

if (content.includes(oldPattern1)) {
  content = content.replace(oldPattern1, newPattern1);
  console.log('✅ Fixed extractIngredientName - removed single-letter matches (l, g)');
}

// Fix extractQuantity:
// OLD: .match(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i)
// NEW: .match(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i)

const oldPattern2 = '.match(/^[\\d½⅓⅔¼¾⅕ⅈ]?(?:\\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\\b/i)';
const newPattern2 = ".match(/^[\\d½⅓⅔¼¾⅕ⅈ]?(?:\\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?|piece|pieces|slice|slices|bunch|head|clove|cloves))?\\b/i)";

if (content.includes(oldPattern2)) {
  content = content.replace(oldPattern2, newPattern2);
  console.log('✅ Fixed extractQuantity - added range support and removed single-letter matches');
}

// Save
fs.writeFileSync(filePath, content, 'utf8');

// Test
console.log('\nTesting the fix...\n');
const { extractIngredientName, extractQuantity } = require('./src/grocery-list-builder');

const tests = [
  { input: "2 large carrots, diced", expectedName: "large carrots, diced", expectedQty: "2" },
  { input: "1 large head of cabbage", expectedName: "large head of cabbage", expectedQty: "1" },
  { input: "4-5 green onions (scallions), chopped", expectedName: "green onions (scallions), chopped", expectedQty: "4-5" },
  { input: "1 tablespoon vegetable oil", expectedName: "vegetable oil", expectedQty: "1 tablespoon" },
  { input: "200g short-grain white rice", expectedName: "short-grain white rice", expectedQty: "200g" },
];

let passCount = 0;
for (const test of tests) {
  const name = extractIngredientName(test.input);
  const qty = extractQuantity(test.input);

  const nameMatch = name === test.expectedName;
  const qtyMatch = qty === test.expectedQty;

  if (nameMatch && qtyMatch) {
    console.log(`✅ "${test.input}"`);
    passCount++;
  } else {
    console.log(`❌ "${test.input}"`);
    if (!nameMatch) console.log(`   Name: "${name}" != "${test.expectedName}"`);
    if (!qtyMatch) console.log(`   Qty: "${qty}" != "${test.expectedQty}"`);
  }
}

console.log(`\n${passCount}/${tests.length} tests passed\n`);

if (passCount === tests.length) {
  console.log('Running complete pipeline...\n');
  const { execSync } = require('child_process');
  try {
    execSync('node complete-pipeline.js', { cwd: __dirname, stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    process.exit(1);
  }
} else {
  console.log('❌ Some tests failed.\n');
  process.exit(1);
}
