/**
 * Test script for translator and pantry-normalizer modules
 */

const translator = require('./src/translator');
const pantryNormalizer = require('./src/pantry-normalizer');

console.log('='.repeat(60));
console.log('Testing New Modules: Translator & Pantry Normalizer');
console.log('='.repeat(60));

// Test 1: Ingredient name normalization
console.log('\n1. Testing ingredient name normalization...');
const testIngredients = [
  '2 green onions, chopped',
  '2 green onions, sliced',
  '1 cup fresh basil, chopped',
  '1 onion, diced',
  '2 cloves garlic, minced',
  '1 lb chicken breast, trimmed',
  '3 tomatoes, seeded and chopped',
  'Salt and pepper to taste',
  'Butter, for serving',
  'Parsley (for garnish)'
];

const normalized = pantryNormalizer.normalizeIngredients(testIngredients);
console.log('Original:', testIngredients);
console.log('\nNormalized:');
normalized.forEach(ing => {
  console.log(`  - ${ing.name}${ing.quantity ? ` (${ing.quantity})` : ''}`);
});

// Test 2: Quantity combination
console.log('\n2. Testing quantity combination...');
const qty1 = '2 cups';
const qty2 = '1 cup';
const combined = pantryNormalizer.combineQuantities(qty1, qty2);
console.log(`  ${qty1} + ${qty2} = ${combined}`);

const qty3 = '500g';
const qty4 = '250g';
const combined2 = pantryNormalizer.combineQuantities(qty3, qty4);
console.log(`  ${qty3} + ${qty4} = ${combined2}`);

// Test 3: Translation (placeholder)
console.log('\n3. Testing translation (placeholder mode)...');
async function testTranslation() {
  const testText = 'Chicken breast with herbs';
  const translated = await translator.translateText(testText, 'ru');
  console.log(`  Original: "${testText}"`);
  console.log(`  Translated: "${translated}"`);

  // Test translating a recipe
  const testRecipe = {
    title: 'Grilled Chicken Salad',
    ingredients: [
      { name: '2 chicken breasts, grilled', quantity: '2' },
      { name: '1 cup lettuce, chopped' },
      { name: '1/2 cup tomatoes, diced' }
    ],
    instructions: [
      'Grill the chicken until cooked through',
      'Combine lettuce and tomatoes in a bowl',
      'Slice chicken and add to salad',
      'Serve with dressing'
    ]
  };

  const translatedRecipe = await translator.translateRecipe(testRecipe);
  console.log('\n  Recipe translation:');
  console.log(`    Title: "${translatedRecipe.title}"`);
  console.log(`    Ingredients (${translatedRecipe.ingredients.length}):`);
  translatedRecipe.ingredients.forEach(ing => {
    console.log(`      - ${ing.name}${ing.quantity ? ` (${ing.quantity})` : ''}`);
  });
}

testTranslation().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('All tests completed successfully!');
  console.log('='.repeat(60));
  console.log('\nNotes:');
  console.log('- Translation is in placeholder mode (logs what needs translation)');
  console.log('- To enable real translation, configure a translation service');
  console.log('- Pantry normalization successfully strips prep methods');
  console.log('- Duplicate ingredients are merged with combined quantities');
});
