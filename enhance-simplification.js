#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the current menu
const menuPath = path.join(__dirname, 'output', 'weekly', '2026-W14', 'menu.json');
const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));

// Enhanced ingredient replacement rules
const ingredientReplacements = {
  // Exotic ingredients to replace with common alternatives
  'edamame': 'peas',
  'seaweed': 'regular vegetables', 
  'mango': 'apple',
  'rice paper': 'tortilla',
  'tofu': 'cottage cheese',
  'coconut milk': 'milk',
  'coconut': 'regular toppings',
  'broth': 'water',
  'spices': 'salt and pepper',
  'herbs': 'regular herbs',
  'chili': 'bell pepper',
  
  // Keep essential Asian cuisine ingredients
  'soy sauce': 'soy sauce',
  'sesame oil': 'sesame oil', 
  'rice': 'rice',
  'rice noodles': 'rice noodles',
  'fish sauce': 'fish sauce',
  'oyster sauce': 'oyster sauce',
  'nori': 'nori',
  'sushi rice': 'sushi rice',
  'ginger': 'ginger'  // ginger is common in Lithuanian cooking too
};

// Function to replace ingredients in a recipe
function replaceIngredientsInRecipe(recipe) {
  if (!recipe.ingredients) return recipe;
  
  return {
    ...recipe,
    ingredients: recipe.ingredients.map(ingredient => {
      const originalName = ingredient.name.toLowerCase();
      let newName = originalName;
      
      // Find replacement for this ingredient
      for (const [exotic, common] of Object.entries(ingredientReplacements)) {
        if (originalName.includes(exotic)) {
          newName = common;
          break;
        }
      }
      
      return {
        ...ingredient,
        name: newName
      };
    })
  };
}

// Process all recipes in the menu
const processedRecipes = {};
for (const [recipeId, recipe] of Object.entries(menuData.recipes)) {
  processedRecipes[recipeId] = replaceIngredientsInRecipe(recipe);
}

// Update the menu data with processed recipes
const updatedMenuData = {
  ...menuData,
  recipes: processedRecipes,
  simplifiedAt: new Date().toISOString(),
  simplifiedExoticIngredients: [
    'edamame → peas',
    'seaweed → regular vegetables',
    'mango → apple',
    'rice paper → tortilla',
    'tofu → cottage cheese',
    'coconut milk → milk',
    'coconut → regular toppings',
    'broth → water',
    'spices → salt and pepper',
    'herbs → regular herbs',
    'chili → bell pepper'
  ]
};

// Write the updated menu back
fs.writeFileSync(menuPath, JSON.stringify(updatedMenuData, null, 2));
console.log(`✅ Enhanced ingredient simplification complete for ${Object.keys(processedRecipes).length} recipes`);

// Count total replacements made
let replacementCount = 0;
Object.values(processedRecipes).forEach(recipe => {
  recipe.ingredients.forEach(ingredient => {
    Object.keys(ingredientReplacements).forEach(exotic => {
      if (ingredient.name.toLowerCase().includes(exotic)) {
        replacementCount++;
      }
    });
  });
});

console.log(`📊 Made ${replacementCount} ingredient replacements total`);

// Rebuild site
console.log('📦 Rebuilding site...');
const execSync = require('child_process').execSync;
try {
  execSync('node src/site-generator.js', { cwd: __dirname, stdio: 'inherit' });
  console.log('✅ Site regenerated successfully');
} catch (error) {
  console.error('❌ Error regenerating site:', error.message);
}

console.log('📋 Enhanced menu simplification complete!');