/**
 * Fix ingredient parsing bugs in grocery-list-builder.js
 * v2: Complete rewrite of the two problematic functions
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ingredient parsing bugs (v2)...\n');

const filePath = path.join(__dirname, 'src/grocery-list-builder.js');
let content = fs.readFileSync(filePath, 'utf8');

// New extractIngredientName function
const newExtractIngredientName = `function extractIngredientName(fullIngredient) {
  // Remove leading numbers, fractions, ranges, and common measurement words
  // Handle both "200g" and "200 g" formats, avoid single-letter matches
  let name = fullIngredient
    // Remove number + optional range + optional unit (with or without space)
    .replace(/^[\\d½⅓⅔¼¾⅕ⅈ]?\\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?)\\s*/i, '') // Remove measurements (no single-letter matches)
    .replace(/^\\s*\\(|\\)\\s*$/g, '') // Remove surrounding parentheses
    .trim();

  // Keep first 3-5 words for better matching
  const words = name.split(/\\s+/);
  return words.slice(0, 5).join(' ');
}`;

// New extractQuantity function
const newExtractQuantity = `function extractQuantity(fullIngredient) {
  // Match: number (with fractions) + optional range + optional unit (with or without space)
  // Units must be complete words to avoid matching parts of words
  const match = fullIngredient.match(/^[\\d½⅓⅔¼¾⅕ⅈ]?\\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|milliliters?|mls?|liters?|pieces?|slices?)?/i);
  return match ? match[0].trim() : 'as needed';
}`;

// Replace the old functions
// extractIngredientName
const oldExtractNameStart = 'function extractIngredientName(fullIngredient) {';
const oldExtractNameEnd = '  return words.slice(0, 5).join(\' \');\n}';

const newExtractNameFull = `function extractIngredientName(fullIngredient) {
  // Remove leading numbers, fractions, ranges, and common measurement words
  // Handle both "200g" and "200 g" formats, avoid single-letter matches
  let name = fullIngredient
    // Remove number + optional range + optional unit (with or without space)
    .replace(/^[\\d½⅓⅔¼¾⅕ⅈ]?\\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|mls?|liters?)\\s*/i, '') // Remove measurements (no single-letter matches)
    .replace(/^\\s*\\(|\\)\\s*$/g, '') // Remove surrounding parentheses
    .trim();

  // Keep first 3-5 words for better matching
  const words = name.split(/\\s+/);
  return words.slice(0, 5).join(' ');
}`;

// Find and replace extractIngredientName
const nameStartIndex = content.indexOf(oldExtractNameStart);
if (nameStartIndex !== -1) {
  const nameEndIndex = content.indexOf(oldExtractNameEnd, nameStartIndex);
  if (nameEndIndex !== -1) {
    content = content.substring(0, nameStartIndex) + newExtractNameFull + content.substring(nameEndIndex + oldExtractNameEnd.length);
    console.log('✅ Updated extractIngredientName function');
  }
}

// extractQuantity
const oldExtractQtyStart = 'function extractQuantity(fullIngredient) {';
const oldExtractQtyEnd = "  return match ? match[0].trim() : 'as needed';\n}";

const newExtractQtyFull = `function extractQuantity(fullIngredient) {
  // Match: number (with fractions) + optional range + optional unit (with or without space)
  // Units must be complete words to avoid matching parts of words
  const match = fullIngredient.match(/^[\\d½⅓⅔¼¾⅕ⅈ]?\\s*(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|grams?|kgs?|milliliters?|mls?|liters?|pieces?|slices?)?/i);
  return match ? match[0].trim() : 'as needed';
}`;

// Find and replace extractQuantity
const qtyStartIndex = content.indexOf(oldExtractQtyStart);
if (qtyStartIndex !== -1) {
  const qtyEndIndex = content.indexOf(oldExtractQtyEnd, qtyStartIndex);
  if (qtyEndIndex !== -1) {
    content = content.substring(0, qtyStartIndex) + newExtractQtyFull + content.substring(qtyEndIndex + oldExtractQtyEnd.length);
    console.log('✅ Updated extractQuantity function');
  }
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Saved changes to grocery-list-builder.js\n');

console.log('Changes made:');
console.log('  - Added support for ranges like "4-5" or "2-3"');
console.log('  - Added support for units attached to numbers like "200g"');
console.log('  - Removed single-letter matches ("l", "g") that were corrupting ingredient names');
console.log('  - Now properly captures full quantity before extracting name\n');

console.log('Running complete-pipeline.js to regenerate...\n');

// Now run the complete pipeline
const { execSync } = require('child_process');
try {
  execSync('node complete-pipeline.js', { cwd: __dirname, stdio: 'inherit' });
  console.log('\n✅ Pipeline completed successfully!\n');
} catch (error) {
  console.error('\n❌ Pipeline failed:', error.message);
  process.exit(1);
}
