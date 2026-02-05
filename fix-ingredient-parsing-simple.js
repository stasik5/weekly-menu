/**
 * Fix ingredient parsing bug in grocery-list-builder.js
 * Simple direct replacement of the problematic regex patterns
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing ingredient parsing bug...\n');

const filePath = path.join(__dirname, 'src/grocery-list-builder.js');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Update regex in extractIngredientName to handle ranges like "4-5"
// Old: /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/
// New: /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/
const oldRegex1 = /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/;
const newRegex1 = /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/;

// Fix 2: Update regex in extractQuantity to handle ranges
// Old: /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i
// New: /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i
const oldRegex2 = /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i;
const newRegex2 = /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\b/i;

// Count replacements
let count1 = 0;
let count2 = 0;

// Replace in content string
content = content.replace(oldRegex1.source, () => {
  count1++;
  return newRegex1.source;
});

content = content.replace(oldRegex2.source, () => {
  count2++;
  return newRegex2.source;
});

if (count1 > 0 || count2 > 0) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed regex patterns\n');
  console.log(`  - Updated extractIngredientName regex: ${count1} replacement(s)`);
  console.log(`  - Updated extractQuantity regex: ${count2} replacement(s)\n`);
  console.log('Changes made:');
  console.log('  - Added support for ranges like "4-5" or "2-3"');
  console.log('  - Now properly captures full quantity range before extracting name\n');
} else {
  console.log('❌ Could not find the regex patterns to replace.\n');
  console.log('Trying string-based replacement...\n');

  // Fallback: try string-based replacement
  const oldString1 = '.replace(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?(?:\\s*\\/\\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?)?\\s*/';
  const newString1 = '.replace(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?(?:\\s*-\\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?)?(?:\\s*\\/\\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?)?\\s*/';

  content = fs.readFileSync(filePath, 'utf8');
  const count1b = content.split(oldString1).length - 1;

  if (count1b > 0) {
    content = content.replace(new RegExp(oldString1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newString1);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed with string replacement\n');

    // Now fix extractQuantity too
    const oldString2 = '.match(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?(?:\\s*\\/\\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?)?(?:\\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\\b/i';
    const newString2 = '.match(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?(?:\\s*-\\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?)?(?:\\s*\\/\\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\\.\d+)?)?(?:\\s+(?:cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|milliliter|ml|liter|piece|pieces|slice|slices|bunch|head|clove|cloves))?\\b/i';

    content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(new RegExp(oldString2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newString2);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed extractQuantity regex too\n');
  } else {
    console.log('❌ All replacement methods failed.\n');
    process.exit(1);
  }
}

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
