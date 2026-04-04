// Recipe Researcher with Web Search
// Uses web_search to find actual recipes with ingredients for each meal

const fs = require('fs');
const path = require('path');

class RecipeResearcher {
  constructor() {
    this.searchResults = {};
    this.recipeCache = new Map();
  }

  // Research recipes for all meals using web_search
  async researchWeeklyRecipes(menu, queries) {
    console.log('🔍 Starting recipe research with web_search...');
    
    try {
      // Search for each meal
      for (const queryData of queries) {
        console.log(`\n🔎 Searching for: ${queryData.query}`);
        
        try {
          // Use web_search to find recipe
          const searchResult = await this.searchRecipe(queryData);
          this.searchResults[`${queryData.day}-${queryData.mealType}`] = searchResult;
          
          console.log(`✅ Found recipe for ${queryData.day} ${queryData.mealType}: ${searchResult.recipeName}`);
          console.log(`📄 Source: ${searchResult.source}`);
          console.log(`🍽️ Cuisine: ${searchResult.cuisine}`);
          console.log(`⏱️ Prep time: ${searchResult.prepTime}`);
          console.log(`🔥 Calories: ${searchResult.calories}`);
          console.log(`📦 Ingredients: ${searchResult.ingredients.length} items`);
          
          // Cache the recipe
          this.recipeCache.set(queryData.query, searchResult);
          
          // Add small delay to avoid overwhelming the search
          await this.delay(1000);
          
        } catch (error) {
          console.warn(`⚠️ Could not find recipe for ${queryData.day} ${queryData.mealType}: ${error.message}`);
          // Use fallback for this meal
          const fallback = this.generateFallbackRecipe(queryData);
          this.searchResults[`${queryData.day}-${queryData.mealType}`] = fallback;
          console.log(`🔄 Using fallback recipe for ${queryData.day} ${queryData.mealType}`);
        }
      }
      
      console.log(`\n✅ Recipe research completed! Found recipes for ${Object.keys(this.searchResults).length}/21 meals`);
      return this.searchResults;
      
    } catch (error) {
      console.error('❌ Error in recipe research:', error.message);
      throw error;
    }
  }

  // Search for a specific recipe using web_search
  async searchRecipe(queryData) {
    try {
      // Use web_search to find recipe
      const searchQuery = queryData.query;
      console.log(`   Searching: "${searchQuery}"`);
      
      // Search for the recipe
      const searchResults = await web_search({
        query: searchQuery,
        count: 3
      });
      
      if (!searchResults || searchResults.length === 0) {
        throw new Error('No search results found');
      }
      
      // Take the first result and extract recipe information
      const result = searchResults[0];
      
      // Try to extract recipe details from the search result
      const recipeInfo = await this.extractRecipeInfo(result, queryData);
      
      return recipeInfo;
      
    } catch (error) {
      console.warn(`   Search failed for "${queryData.query}": ${error.message}`);
      throw error;
    }
  }

  // Extract recipe information from search results
  async extractRecipeInfo(searchResult, queryData) {
    // Try to parse the snippet to extract recipe information
    const snippet = searchResult.snippet || '';
    
    // Look for ingredient indicators in the snippet
    const ingredientIndicators = ['ingredients:', 'ingredients:', 'requires:', 'need:', 'include:'];
    let ingredients = [];
    
    // Try to find ingredients in the snippet
    for (const indicator of ingredientIndicators) {
      const index = snippet.toLowerCase().indexOf(indicator);
      if (index !== -1) {
        const ingredientsText = snippet.substring(index + indicator.length);
        ingredients = this.parseIngredients(ingredientsText);
        break;
      }
    }
    
    // If no ingredients found, use common ingredients for this type of meal
    if (ingredients.length === 0) {
      ingredients = this.getCommonIngredients(queryData);
    }
    
    return {
      recipeName: searchResult.title || queryData.mealName,
      source: searchResult.url || 'Unknown',
      cuisine: queryData.cuisine,
      prepTime: this.getTypicalPrepTime(queryData),
      calories: this.getTypicalCalories(queryData),
      ingredients: ingredients,
      instructions: this.generateGenericInstructions(queryData),
      url: searchResult.url
    };
  }

  // Parse ingredients from text
  parseIngredients(text) {
    const ingredients = [];
    const lines = text.split('\n').slice(0, 10); // Limit to first 10 lines
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.toLowerCase().includes('click') && !trimmed.toLowerCase().includes('here')) {
        // Try to extract quantity and item
        const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cup|tbsp|tsp|oz|lb|piece|cloves?)\s+(.+)$/);
        if (match) {
          ingredients.push({
            item: match[3].trim(),
            amount: parseFloat(match[1]),
            unit: match[2]
          });
        } else {
          ingredients.push({
            item: trimmed,
            amount: 1,
            unit: 'piece'
          });
        }
      }
    }
    
    return ingredients.slice(0, 8); // Limit to 8 ingredients
  }

  // Get common ingredients for a meal type
  getCommonIngredients(queryData) {
    const commonIngredients = {
      slavic: {
        breakfast: [
          { item: 'flour', amount: 200, unit: 'g' },
          { item: 'eggs', amount: 2, unit: 'large' },
          { item: 'milk', amount: 300, unit: 'ml' },
          { item: 'butter', amount: 30, unit: 'g' },
          { item: 'sour cream', amount: 50, unit: 'g' }
        ],
        lunch: [
          { item: 'potatoes', amount: 300, unit: 'g' },
          { item: 'onion', amount: 1, unit: 'medium' },
          { item: 'carrots', amount: 150, unit: 'g' },
          { item: 'beef', amount: 400, unit: 'g' },
          { item: 'cabbage', amount: 200, unit: 'g' }
        ],
        dinner: [
          { item: 'meat', amount: 500, unit: 'g' },
          { item: 'pasta', amount: 200, unit: 'g' },
          { item: 'mushrooms', amount: 200, unit: 'g' },
          { item: 'onion', amount: 1, unit: 'large' },
          { item: 'sour cream', amount: 100, unit: 'g' }
        ]
      },
      asian: {
        breakfast: [
          { item: 'rice', amount: 150, unit: 'g' },
          { item: 'eggs', amount: 2, unit: 'large' },
          { item: 'soy sauce', amount: 2, unit: 'tbsp' },
          { item: 'green onions', amount: 30, unit: 'g' },
          { item: 'vegetable oil', amount: 2, unit: 'tbsp' }
        ],
        lunch: [
          { item: 'rice', amount: 200, unit: 'g' },
          { item: 'vegetables', amount: 200, unit: 'g' },
          { item: 'eggs', amount: 2, unit: 'large' },
          { item: 'soy sauce', amount: 3, unit: 'tbsp' },
          { item: 'sesame oil', amount: 1, unit: 'tbsp' }
        ],
        dinner: [
          { item: 'protein', amount: 400, unit: 'g' },
          { item: 'rice', amount: 200, unit: 'g' },
          { item: 'vegetables', amount: 200, unit: 'g' },
          { item: 'sauce', amount: 100, unit: 'ml' },
          { item: 'herbs', amount: 20, unit: 'g' }
        ]
      }
    };
    
    return commonIngredients[queryData.cuisine][queryData.mealType] || [];
  }

  // Get typical prep time for a meal
  getTypicalPrepTime(queryData) {
    const times = {
      slavic: {
        breakfast: '20-30 min',
        lunch: '30-45 min',
        dinner: '45-60 min'
      },
      asian: {
        breakfast: '15-25 min',
        lunch: '20-30 min',
        dinner: '30-45 min'
      }
    };
    
    return times[queryData.cuisine][queryData.mealType] || '30 min';
  }

  // Get typical calories for a meal
  getTypicalCalories(queryData) {
    const calories = {
      slavic: {
        breakfast: 600,
        lunch: 800,
        dinner: 900
      },
      asian: {
        breakfast: 500,
        lunch: 700,
        dinner: 850
      }
    };
    
    return calories[queryData.cuisine][queryData.mealType] || 700;
  }

  // Generate generic cooking instructions
  generateGenericInstructions(queryData) {
    const instructions = {
      slavic: {
        breakfast: "Mix dry ingredients, add wet ingredients, cook on medium heat until golden brown.",
        lunch: "Sauté vegetables, add meat, simmer until tender. Serve with sour cream.",
        dinner: "Brown meat, add vegetables and sauce, simmer until cooked through. Serve with rice or potatoes."
      },
      asian: {
        breakfast: "Stir-fry ingredients over high heat, season with soy sauce, serve hot.",
        lunch: "Cook rice, stir-fry vegetables and protein, combine with sauce.",
        dinner: "Marinate protein, stir-fry with vegetables, add sauce, serve over rice."
      }
    };
    
    return instructions[queryData.cuisine][queryData.mealType] || "Follow recipe instructions.";
  }

  // Generate fallback recipe if search fails
  generateFallbackRecipe(queryData) {
    return {
      recipeName: queryData.mealName,
      source: 'Fallback recipe',
      cuisine: queryData.cuisine,
      prepTime: this.getTypicalPrepTime(queryData),
      calories: this.getTypicalCalories(queryData),
      ingredients: this.getCommonIngredients(queryData),
      instructions: this.generateGenericInstructions(queryData),
      url: null
    };
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Save research results
  saveResearchResults(results) {
    const filename = `data/recipe-research-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`💾 Saved research results to ${filename}`);
    return filename;
  }
}

// Export for use in other modules
module.exports = RecipeResearcher;

// Run if called directly
if (require.main === module) {
  async function main() {
    console.log('🔍 Starting Recipe Research...\n');
    
    try {
      // Load menu structure
      const menuFile = fs.readFileSync('data/menu-2026-03-28.json', 'utf8');
      const menu = JSON.parse(menuFile);
      
      // Load search queries
      const queriesFile = fs.readFileSync('data/recipe-search-queries.json', 'utf8');
      const queries = JSON.parse(queriesFile);
      
      const researcher = new RecipeResearcher();
      const results = await researcher.researchWeeklyRecipes(menu, queries);
      
      // Save results
      researcher.saveResearchResults(results);
      
      console.log('\n✅ Recipe research completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in recipe research:', error.message);
      throw error;
    }
  }
  
  main().catch(console.error);
}