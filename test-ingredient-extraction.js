// Test ingredient extraction

function extractIngredientName(fullIngredient) {
  // Remove leading numbers, fractions, and common measurement words
  let name = fullIngredient
    .replace(/^[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?(?:\s*-\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?(?:\s*\/\s*[\d½⅓⅔¼¾⅕⅛⅐⅑⅒]+(?:\.\d+)?)?\s*/, '') // Remove leading numbers, fractions, and decimals (e.g., "1", "1.5", "1/2", "3/4")
    .replace(/^(cup|cups|tablespoon|tbsp|teaspoon|tsp|ounce|oz|pound|lb|gram|g|kg|ml|liter|l|piece|pieces|slice|slices|bunch|head|clove|cloves)\s*(of\s*)?/i, '') // Remove measurements
    .replace(/^\s*\(|\)\s*$/g, '') // Remove surrounding parentheses
    .trim();

  // Keep first 3-5 words for better matching
  const words = name.split(/\s+/);
  return words.slice(0, 5).join(' ');
}

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
  console.log(`Input:  "${ingredient}"`);
  console.log(`Output: "${name}"`);
  console.log();
}
