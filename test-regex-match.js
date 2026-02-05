// Test if the regex is matching incorrectly

const testStr = "large carrots, diced";
const pattern = /^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/;

console.log('Testing pattern:', pattern);
console.log('Test string:', testStr);
console.log('Match:', testStr.match(pattern));

// Also test the second pattern
const pattern2 = /^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves)\s*(of\s*)?/i;
console.log('\nTesting pattern2:', pattern2);
console.log('Test string:', testStr);
console.log('Match:', testStr.match(pattern2));

// Test full extraction
const fullStr = "2 large carrots, diced";
const result = fullStr.replace(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/, '');
console.log('\nFull extraction:');
console.log('Input:', fullStr);
console.log('After first replace:', result);

const result2 = result.replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves)\s*(of\s*)?/i, '');
console.log('After second replace:', result2);

// Check character codes
console.log('\nCharacter codes for "large":');
for (const char of 'large') {
  console.log(`  "${char}": U+${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
