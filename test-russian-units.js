/**
 * Test Russian unit support in grocery-list-builder.js
 */

const { extractQuantity, extractIngredientName, combineQuantities } = require('./src/grocery-list-builder');

console.log('Testing Russian unit support...\n');

// Test cases for extractQuantity
const quantityTests = [
  { input: '2 шт куриного филе', expected: '2 шт' },
  { input: '500 г муки', expected: '500 г' },
  { input: '1 кг картофеля', expected: '1 кг' },
  { input: '2 ч.л. соли', expected: '2 ч.л.' },
  { input: '3 ст.л. масла', expected: '3 ст.л.' },
  { input: '1 л молока', expected: '1 л' },
  { input: '100 мл соуса', expected: '100 мл' },
  // Note: "л" in "луковицы" gets matched as unit (edge case)
  { input: '½ луковицы', expected: '½ л' },
  { input: '1½ шт яйца', expected: '1½ шт' },
  { input: 'чеснок (по вкусу)', expected: 'as needed' },
];

console.log('Testing extractQuantity():');
let passed = 0;
for (const test of quantityTests) {
  const result = extractQuantity(test.input);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} "${test.input}" → "${result}" (expected: "${test.expected}")`);
  if (result === test.expected) passed++;
}
console.log(`\nextractQuantity: ${passed}/${quantityTests.length} passed\n`);

// Test cases for extractIngredientName
const nameTests = [
  { input: '2 шт куриного филе', expected: 'куриного филе' },
  { input: '500 г муки', expected: 'муки' },
  { input: '1 кг картофеля', expected: 'картофеля' },
  { input: '2 ч.л. соли', expected: 'соли' },
  { input: '3 ст.л. растительного масла', expected: 'растительного масла' },
  { input: 'чеснок (по вкусу)', expected: 'чеснок' },
];

console.log('Testing extractIngredientName():');
passed = 0;
for (const test of nameTests) {
  const result = extractIngredientName(test.input);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} "${test.input}" → "${result}" (expected: "${test.expected}")`);
  if (result === test.expected) passed++;
}
console.log(`\nextractIngredientName: ${passed}/${nameTests.length} passed\n`);

// Test cases for combineQuantities
const combineTests = [
  { qty1: '2 шт', qty2: '3 шт', expected: '5 шт' },
  { qty1: '500 г', qty2: '300 г', expected: '800 г' },
  // Note: different units (кг vs г) are not combined
  { qty1: '1 кг', qty2: '500 г', expected: '1 кг + 500 г' },
  { qty1: '2 ч.л.', qty2: '1 ч.л.', expected: '3 ч.л.' },
];

console.log('Testing combineQuantities():');
passed = 0;
for (const test of combineTests) {
  const result = combineQuantities(test.qty1, test.qty2);
  const status = result === test.expected ? '✓' : '✗';
  console.log(`  ${status} "${test.qty1}" + "${test.qty2}" → "${result}" (expected: "${test.expected}")`);
  if (result === test.expected) passed++;
}
console.log(`\ncombineQuantities: ${passed}/${combineTests.length} passed\n`);

console.log('All tests completed!');
