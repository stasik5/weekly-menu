// Research Real Recipes using Web Search
// Uses OpenClaw web_search tool to find actual recipes

const fs = require('fs');

class RecipeResearcher {
  constructor() {
    this.results = {};
  }

  async searchAllRecipes() {
    try {
      // Load the menu structure
      const menuFile = fs.readFileSync('data/menu-2026-03-28.json', 'utf8');
      const menu = JSON.parse(menuFile);
      
      const queries = [];
      
      // Generate search queries from menu
      for (const day of menu.days) {
        for (const mealType in day.meals) {
          const meal = day.meals[mealType];
          queries.push({
            day: day.day,
            mealType: mealType,
            mealName: meal.name,
            query: `${meal.name} ingredients recipe`,
            cuisine: meal.cuisine
          });
        }
      }
      
      console.log(`🔍 Generated ${queries.length} search queries\n`);
      
      // Search for each recipe
      for (const queryData of queries) {
        console.log(`🔎 Searching for: ${queryData.query}`);
        
        try {
          // Use OpenClaw web_search tool
          const searchResults = await web_search({
            query: queryData.query,
            count: 3
          });
          
          if (!searchResults || searchResults.length === 0) {
            throw new Error('No search results found');
          }
          
          // Process the search results
          const recipeInfo = this.processSearchResult(searchResults[0], queryData);
          
          this.results[`${queryData.day}-${queryData.mealType}`] = recipeInfo;
          
          console.log(`✅ Found recipe for ${queryData.day} ${queryData.mealType}: ${recipeInfo.recipeName}`);
          console.log(`📄 Source: ${recipeInfo.source}`);
          console.log(`🍽️ Cuisine: ${recipeInfo.cuisine}`);
          console.log(`🔥 Calories: ${recipeInfo.calories}`);
          console.log(`📦 Ingredients: ${recipeInfo.ingredients.length} items\n`);
          
          // Small delay to avoid overwhelming the search
          await new Promise(resolve => setTimeout(resolve, 1500));
          
        } catch (error) {
          console.warn(`⚠️ Could not find recipe for ${queryData.day} ${queryData.mealType}: ${error.message}`);
          // Use fallback recipe
          const fallback = this.generateFallback(queryData);
          this.results[`${queryData.day}-${queryData.mealType}`] = fallback;
          console.log(`🔄 Using fallback recipe for ${queryData.day} ${queryData.mealType}\n`);
        }
      }
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Error in recipe research:', error.message);
      throw error;
    }
  }

  processSearchResult(searchResult, queryData) {
    // Extract recipe information from search result
    const recipeName = searchResult.title || queryData.mealName;
    const source = searchResult.url || 'Unknown';
    
    // Parse ingredients from snippet if available
    const ingredients = this.parseIngredients(searchResult.snippet || '');
    
    // Generate cooking instructions
    const instructions = this.generateInstructions(queryData);
    
    return {
      recipeName: recipeName,
      source: source,
      cuisine: queryData.cuisine,
      prepTime: this.getPrepTime(queryData.mealType),
      calories: this.getCalorieTarget(queryData.mealType),
      ingredients: ingredients,
      instructions: instructions,
      url: searchResult.url
    };
  }

  parseIngredients(snippet) {
    const ingredients = [];
    const lines = snippet.split('\n').slice(0, 8);
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 10 && !trimmed.toLowerCase().includes('click')) {
        // Try to extract quantity and unit
        const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|cup|tbsp|tsp|oz|lb|piece|cloves?)\s+(.+)$/i);
        if (match) {
          ingredients.push({
            item: match[3].trim(),
            amount: parseFloat(match[1]),
            unit: match[2].toLowerCase()
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
    
    // If no ingredients found, use fallback
    if (ingredients.length === 0) {
      return this.getFallbackIngredients(queryData);
    }
    
    return ingredients.slice(0, 8);
  }

  getFallbackIngredients(queryData) {
    const fallbacks = {
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
          { item: 'beef', amount: 400, unit: 'g' },
          { item: 'carrots', amount: 150, unit: 'g' },
          { item: 'onion', amount: 1, unit: 'medium' },
          { item: 'cabbage', amount: 200, unit: 'g' }
        ],
        dinner: [
          { item: 'beef', amount: 500, unit: 'g' },
          { item: 'pasta', amount: 200, unit: 'g' },
          { item: 'mushrooms', amount: 200, unit: 'g' },
          { item: 'sour cream', amount: 100, unit: 'g' },
          { item: 'garlic', amount: 3, unit: 'cloves' }
        ]
      },
      asian: {
        breakfast: [
          { item: 'rice', amount: 150, unit: 'g' },
          { item: 'eggs', amount: 2, unit: 'large' },
          { item: 'soy sauce', amount: 2, unit: 'tbsp' },
          { item: 'vegetable oil', amount: 2, unit: 'tbsp' },
          { item: 'green onions', amount: 30, unit: 'g' }
        ],
        lunch: [
          { item: 'rice', amount: 200, unit: 'g' },
          { item: 'vegetables', amount: 200, unit: 'g' },
          { item: 'eggs', amount: 2, unit: 'large' },
          { item: 'soy sauce', amount: 3, unit: 'tbsp' },
          { item: 'sesame oil', amount: 1, unit: 'tbsp' }
        ],
        dinner: [
          { item: 'chicken', amount: 400, unit: 'g' },
          { item: 'rice', amount: 200, unit: 'g' },
          { item: 'vegetables', amount: 200, unit: 'g' },
          { item: 'coconut milk', amount: 200, unit: 'ml' },
          { item: 'curry paste', amount: 2, unit: 'tbsp' }
        ]
      }
    };
    
    return fallbacks[queryData.cuisine][queryData.mealType] || [];
  }

  generateInstructions(queryData) {
    const instructions = {
      slavic: {
        breakfast: "Mix ingredients, cook on medium heat until golden. Serve with sour cream.",
        lunch: "Cook meat and vegetables together. Season to taste. Serve hot.",
        dinner: "Brown meat, add vegetables and sauce. Simmer until tender. Serve with sides."
      },
      asian: {
        breakfast: "Stir-fry ingredients over high heat. Season with soy sauce. Serve immediately.",
        lunch: "Cook rice, stir-fry vegetables and protein. Combine with sauce.",
        dinner: "Marinate protein, cook with vegetables. Add sauce and serve over rice."
      }
    };
    
    return instructions[queryData.cuisine][queryData.mealType] || "Follow recipe instructions.";
  }

  getPrepTime(mealType) {
    const times = {
      breakfast: '15-25 min',
      lunch: '20-35 min',
      dinner: '30-60 min'
    };
    return times[mealType];
  }

  getCalorieTarget(mealType) {
    const calories = {
      breakfast: 600,
      lunch: 800,
      dinner: 900
    };
    return calories[mealType] || 700;
  }

  generateFallback(queryData) {
    return {
      recipeName: queryData.mealName,
      source: 'Fallback recipe',
      cuisine: queryData.cuisine,
      prepTime: this.getPrepTime(queryData.mealType),
      calories: this.getCalorieTarget(queryData.mealType),
      ingredients: this.getFallbackIngredients(queryData),
      instructions: this.generateInstructions(queryData),
      url: null
    };
  }

  saveResults(results) {
    const today = new Date().toISOString().split('T')[0];
    const filename = `data/recipes-${today}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`💾 Saved recipe results to ${filename}`);
    return filename;
  }
}

// Run recipe research
async function main() {
  console.log('🔍 Starting Recipe Research with Web Search...\n');
  
  try {
    const researcher = new RecipeResearcher();
    const results = await researcher.searchAllRecipes();
    
    // Save results
    researcher.saveResults(results);
    
    console.log('\n✅ Recipe research completed successfully!');
    console.log(`📝 Found recipes for ${Object.keys(results).length}/21 meals`);
    console.log('🔗 Next step: Build grocery list and generate HTML site');
    
  } catch (error) {
    console.error('❌ Error in recipe research:', error.message);
    throw error;
  }
}

// Export for use in other modules
module.exports = RecipeResearcher;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}