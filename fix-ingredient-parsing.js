/**
 * Fix ingredient parsing bug in grocery-list-builder.js
 * The extractIngredientName function has a regex that doesn't handle ranges like "4-5" or removes too much
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ingredient parsing bug...\n');

// Read the current grocery-list-builder.js
const groceryListBuilderPath = path.join(__dirname, 'src/grocery-list-builder.js');
let content = fs.readFileSync(groceryListBuilderPath, 'utf8');

// The problematic regex in extractIngredientName
const oldRegex = /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/;

// New regex that handles ranges like "4-5", "2-3", etc.
// Match: optional number, optional dash, optional number, then spaces
const newRegex = /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/;

// Replace in extractIngredientName function
const oldExtractIngredientName = `function extractIngredientName(fullIngredient) {
  // Remove leading numbers, fractions, and common measurement words
  let name = fullIngredient
    .replace(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/, '') // Remove leading numbers, fractions, and decimals (e.g., "1", "1.5", "1/2", "3/4")
    .replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves)\s*(of\s*)?/i, '') // Remove measurements
    .replace(/^\s*\(|\)\s*$/g, '') // Remove surrounding parentheses
    .trim();

  // Keep first 3-5 words for better matching
  const words = name.split(/\s+/);
  return words.slice(0, 5).join(' ');
}`;

const newExtractIngredientName = `function extractIngredientName(fullIngredient) {
  // Remove leading numbers, fractions (including ranges like "4-5"), and common measurement words
  let name = fullIngredient
    .replace(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/, '') // Remove leading numbers, fractions, ranges (e.g., "4-5", "1", "1.5", "1/2", "3/4")
    .replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves)\s*(of\s*)?/i, '') // Remove measurements
    .replace(/^\s*\(|\)\s*$/g, '') // Remove surrounding parentheses
    .trim();

  // Keep first 3-5 words for better matching
  const words = name.split(/\s+/);
  return words.slice(0, 5).join(' ');
}`;

// Also need to fix extractQuantity to handle ranges
const oldExtractQuantity = `function extractQuantity(fullIngredient) {
  // Match: number (with fractions) + optional unit
  // Units must be complete words to avoid matching parts of words
  const match = fullIngredient.match(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i);
  return match ? match[0].trim() : 'as needed';
}`;

const newExtractQuantity = `function extractQuantity(fullIngredient) {
  // Match: number (with fractions) + optional range (e.g., "4-5") + optional unit
  // Units must be complete words to avoid matching parts of words
  const match = fullIngredient.match(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i);
  return match ? match[0].trim() : 'as needed';
}`;

// Replace in the file
if (content.includes(oldExtractIngredientName) && content.includes(oldExtractQuantity)) {
  content = content.replace(oldExtractIngredientName, newExtractIngredientName);
  content = content.replace(oldExtractQuantity, newExtractQuantity);

  // Write back
  fs.writeFileSync(groceryListBuilderPath, content, 'utf8');
  console.log('✅ Fixed extractIngredientName and extractQuantity functions\n');
  console.log('Changes made:');
  console.log('  - Updated regex to handle ranges like "4-5" or "2-3"');
  console.log('  - Now properly captures full quantity range before extracting name\n');
} else {
  console.log('❌ Could not find the functions to replace. The file may have been modified.\n');
  process.exit(1);
}

console.log('Now regenerating the grocery list with the fix...\n');

// Now run the complete pipeline to regenerate everything
const { execSync } = require('child_process');
try {
  execSync('node complete-pipeline.js', { cwd: __dirname, stdio: 'inherit' });
  console.log('\n✅ Pipeline completed successfully!');
  console.log('📦 Please verify the pantry data in the generated HTML.\n');
} catch (error) {
  console.error('\n❌ Pipeline failed:', error.message);
  process.exit(1);
}
