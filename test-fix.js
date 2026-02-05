// Test with actual module
const { extractIngredientName, extractQuantity } = require('./src/grocery-list-builder');

const testIngredients = [
  "2 large carrots, diced",
  "1 large head of cabbage",
  "4-5 green onions (scallions), chopped",
  "1 tablespoon vegetable oil",
  "200g short-grain white rice"
];

console.log("Testing ingredient extraction:\n");
for (const ingredient of testIngredients) {
  const name = extractIngredientName(ingredient);
  const qty = extractQuantity(ingredient);
  console.log(`Input:  "${ingredient}"`);
  console.log(`  Name: "${name}"`);
  console.log(`  Qty:  "${qty}"`);
  console.log();
}
