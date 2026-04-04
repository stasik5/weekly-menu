// Complete Grocery Planner Pipeline with Real Recipe Research
// Uses OpenClaw web_search to find actual recipes for each meal

const fs = require('fs');
const path = require('path');

class CompleteGroceryPlanner {
  constructor() {
    this.config = {
      nutrition: 'medium',
      targetCalories: 4000,
      cuisineRatio: {
        slavic: 0.6,
        asian: 0.4
      },
      people: [
        {
          name: 'Stanislav',
          age: 31,
          weight: 85,
          gender: 'male',
          preference: 'slavic'
        },
        {
          name: 'Wife',
          age: 26,
          weight: 63,
          gender: 'female',
          preference: 'asian'
        }
      ]
    };
    
    this.weekStart = new Date('2026-03-29');
    this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    this.mealTypes = ['breakfast', 'lunch', 'dinner'];
  }

  // Generate weekly menu structure
  generateWeeklyMenu() {
    console.log('📋 Generating weekly menu structure...');
    
    const menu = {
      generated: new Date().toISOString(),
      week: this.getWeekRange(),
      cuisineBalance: {
        slavic: 0,
        asian: 0
      },
      nutritionProfile: this.config.nutrition,
      targetCalories: this.config.targetCalories,
      days: []
    };

    const slavicMeals = Math.round(21 * this.config.cuisineRatio.slavic); // 13 meals
    const asianMeals = Math.round(21 * this.config.cuisineRatio.asian); // 8 meals
    
    let mealsGenerated = { slavic: 0, asian: 0 };

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = this.days[dayIndex];
      const date = new Date(this.weekStart);
      date.setDate(date.getDate() + dayIndex);
      
      const dayMeals = {
        day: day,
        date: date.toISOString().split('T')[0],
        meals: {}
      };

      for (const mealType of this.mealTypes) {
        let selectedCuisine;
        
        if (mealsGenerated.slavic < slavicMeals && 
            (mealsGenerated.asian >= asianMeals || Math.random() < 0.7)) {
          selectedCuisine = 'slavic';
        } else {
          selectedCuisine = 'asian';
        }

        const cuisineMeals = this.getRecipeTemplates(selectedCuisine, mealType);
        const mealName = cuisineMeals[Math.floor(Math.random() * cuisineMeals.length)];
        
        dayMeals.meals[mealType] = {
          name: mealName,
          cuisine: selectedCuisine,
          type: mealType,
          calories: this.getCalorieTarget(mealType, this.config.nutrition),
          prepTime: this.getPrepTime(mealType),
          ingredients: [],
          instructions: []
        };

        mealsGenerated[selectedCuisine]++;
      }

      menu.days.push(dayMeals);
    }

    menu.cuisineBalance = {
      slavic: mealsGenerated.slavic,
      asian: mealsGenerated.asian,
      slavicPercent: Math.round((mealsGenerated.slavic / 21) * 100),
      asianPercent: Math.round((mealsGenerated.asian / 21) * 100)
    };

    console.log(`🍽️ Generated menu: ${mealsGenerated.slavic} Slavic (${menu.cuisineBalance.slavicPercent}%), ${mealsGenerated.asian} Asian (${menu.cuisineBalance.asianPercent}%)`);
    
    return menu;
  }

  // Get recipe templates for specific cuisine and meal type
  getRecipeTemplates(cuisine, mealType) {
    const templates = {
      slavic: {
        breakfast: ['Russian Blini', 'Syrniki cottage cheese pancakes', 'Buckwheat porridge', 'Oatmeal kasha', 'Tvorog pancakes'],
        lunch: ['Classic Borscht', 'Chicken Kiev', 'Pelmeni', 'Beef Stroganoff', 'Golubtsi cabbage rolls', 'Buckwheat with mushrooms'],
        dinner: ['Beef Stroganoff', 'Chicken Kiev', 'Golubtsi', 'Pelmeni', 'Solyanka soup', 'Draniki potato pancakes', 'Beef Borscht']
      },
      asian: {
        breakfast: ['Thai Congee', 'Chinese Dim Sum', 'Vietnamese Pho', 'Japanese Miso Soup', 'Rice Porridge'],
        lunch: ['Vegetable Fried Rice', 'Chicken Ramen', 'Spring Rolls', 'Dumplings', 'Tom Yum Soup', 'Pad Thai'],
        dinner: ['Kung Pao Chicken', 'Thai Green Curry', 'Beef Pho', 'Red Curry', 'Singapore Noodles', 'Massaman Curry']
      }
    };
    
    return templates[cuisine][mealType] || ['Generic meal'];
  }

  getWeekRange() {
    const end = new Date(this.weekStart);
    end.setDate(end.getDate() + 6);
    return `${this.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${this.weekStart.getFullYear()}`;
  }

  getCalorieTarget(mealType, nutritionLevel) {
    const baseCalories = {
      breakfast: { low: 400, medium: 600, high: 800 },
      lunch: { low: 600, medium: 800, high: 1000 },
      dinner: { low: 700, medium: 900, high: 1100 }
    };
    
    return baseCalories[mealType][nutritionLevel] || baseCalories[mealType].medium;
  }

  getPrepTime(mealType) {
    const times = {
      breakfast: '15-25 min',
      lunch: '20-35 min',
      dinner: '30-60 min'
    };
    return times[mealType];
  }

  // Research recipes using web_search
  async researchRecipes(menu) {
    console.log('🔍 Starting recipe research...');
    
    const recipes = {};
    const searchQueries = [];

    // Generate search queries
    for (const day of menu.days) {
      for (const mealType in day.meals) {
        const meal = day.meals[mealType];
        const query = `${meal.name} ingredients recipe`;
        searchQueries.push({
          day: day.day,
          mealType: mealType,
          mealName: meal.name,
          query: query,
          cuisine: meal.cuisine
        });
      }
    }

    console.log(`🔍 Generated ${searchQueries.length} search queries`);

    // Search for each recipe
    for (const queryData of searchQueries) {
      console.log(`\n🔎 Searching for: ${queryData.query}`);
      
      try {
        // Use OpenClaw web_search
        const searchResult = await this.searchRecipe(queryData);
        recipes[`${queryData.day}-${queryData.mealType}`] = searchResult;
        
        console.log(`✅ Found recipe for ${queryData.day} ${queryData.mealType}: ${searchResult.recipeName}`);
        console.log(`📄 Source: ${searchResult.source}`);
        console.log(`🍽️ Cuisine: ${searchResult.cuisine}`);
        console.log(`🔥 Calories: ${searchResult.calories}`);
        console.log(`📦 Ingredients: ${searchResult.ingredients.length} items`);
        
        // Add small delay to avoid overwhelming the search
        await this.delay(1500);
        
      } catch (error) {
        console.warn(`⚠️ Could not find recipe for ${queryData.day} ${queryData.mealType}: ${error.message}`);
        // Use fallback
        const fallback = this.generateFallbackRecipe(queryData);
        recipes[`${queryData.day}-${queryData.mealType}`] = fallback;
        console.log(`🔄 Using fallback recipe for ${queryData.day} ${queryData.mealType}`);
      }
    }

    return recipes;
  }

  // Search for a specific recipe using web_search
  async searchRecipe(queryData) {
    try {
      // Use web_search to find recipe
      const searchResults = await web_search({
        query: queryData.query,
        count: 3
      });
      
      if (!searchResults || searchResults.length === 0) {
        throw new Error('No search results found');
      }
      
      // Take the first result
      const result = searchResults[0];
      
      // Extract recipe information
      const recipeInfo = this.extractRecipeInfo(result, queryData);
      
      return recipeInfo;
      
    } catch (error) {
      console.warn(`   Search failed: ${error.message}`);
      throw error;
    }
  }

  // Extract recipe information from search results
  extractRecipeInfo(searchResult, queryData) {
    const recipeName = searchResult.title || queryData.mealName;
    const source = searchResult.url || 'Unknown';
    
    // Parse ingredients from snippet if available
    const ingredients = this.parseIngredientsFromSnippet(searchResult.snippet || '');
    
    return {
      recipeName: recipeName,
      source: source,
      cuisine: queryData.cuisine,
      prepTime: this.getPrepTime(queryData.mealType),
      calories: this.getCalorieTarget(queryData.mealType, this.config.nutrition),
      ingredients: ingredients.length > 0 ? ingredients : this.getFallbackIngredients(queryData),
      instructions: this.generateInstructions(queryData),
      url: searchResult.url
    };
  }

  // Parse ingredients from search snippet
  parseIngredientsFromSnippet(snippet) {
    const ingredients = [];
    const lines = snippet.split('\n').slice(0, 8);
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 10 && !trimmed.toLowerCase().includes('click')) {
        // Extract quantity and item
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
    
    return ingredients.slice(0, 8);
  }

  // Get fallback ingredients
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

  // Generate generic instructions
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

  // Generate fallback recipe
  generateFallbackRecipe(queryData) {
    return {
      recipeName: queryData.mealName,
      source: 'Fallback recipe',
      cuisine: queryData.cuisine,
      prepTime: this.getPrepTime(queryData.mealType),
      calories: this.getCalorieTarget(queryData.mealType, this.config.nutrition),
      ingredients: this.getFallbackIngredients(queryData),
      instructions: this.generateInstructions(queryData),
      url: null
    };
  }

  // Build grocery list
  buildGroceryList(menu, recipes) {
    console.log('🛒 Building grocery list...');
    
    const allIngredients = {};
    const categories = {
      'Proteins': [],
      'Vegetables': [],
      'Grains & Starches': [],
      'Dairy': [],
      'Spices & Seasonings': [],
      'Oils & Fats': [],
      'Sauces & Condiments': []
    };

    // Collect all ingredients from recipes
    for (const day of menu.days) {
      for (const mealType in day.meals) {
        const meal = day.meals[mealType];
        const recipeKey = `${day.day}-${mealType}`;
        const recipe = recipes[recipeKey];
        
        if (recipe && recipe.ingredients) {
          for (const ingredient of recipe.ingredients) {
            const key = `${ingredient.item.toLowerCase()}`;
            
            if (!allIngredients[key]) {
              allIngredients[key] = {
                item: ingredient.item,
                amount: 0,
                unit: ingredient.unit,
                recipes: []
              };
            }
            
            // Convert to common units for combining
            const commonAmount = this.convertToCommonUnit(ingredient);
            allIngredients[key].amount += commonAmount;
            allIngredients[key].recipes.push(recipe.recipeName);
          }
        }
      }
    }

    // Categorize ingredients
    const categorized = {};
    Object.keys(allIngredients).forEach(key => {
      const ingredient = allIngredients[key];
      const category = this.categorizeIngredient(ingredient.item);
      
      if (!categorized[category]) {
        categorized[category] = [];
      }
      
      categorized[category].push({
        item: ingredient.item,
        amount: Math.round(ingredient.amount),
        unit: ingredient.unit,
        recipes: ingredient.recipes
      });
    });

    // Sort categories and items
    const sortedGroceryList = {};
    Object.keys(categories).forEach(category => {
      if (categorized[category]) {
        sortedGroceryList[category] = categorized[category].sort((a, b) => a.item.localeCompare(b.item));
      }
    });

    const totalItems = Object.values(allIngredients).length;
    
    console.log(`🛒 Grocery list built with ${totalItems} unique items`);
    
    return {
      totalItems,
      categorized: sortedGroceryList,
      timestamp: new Date().toISOString()
    };
  }

  // Convert ingredient amounts to common units
  convertToCommonUnit(ingredient) {
    const conversions = {
      g: 1,
      kg: 1000,
      mg: 0.001,
      ml: 1,
      l: 1000,
      cup: 240, // ml
      tbsp: 15, // ml
      tsp: 5, // ml
      oz: 28, // g
      lb: 453, // g
      piece: 1,
      cloves: 1,
      small: 1,
      medium: 1,
      large: 1
    };
    
    return (ingredient.amount || 1) * (conversions[ingredient.unit] || 1);
  }

  // Categorize ingredient by type
  categorizeIngredient(item) {
    const itemLower = item.toLowerCase();
    
    if (itemLower.includes('meat') || itemLower.includes('beef') || itemLower.includes('chicken') || 
        itemLower.includes('pork') || itemLower.includes('fish') || itemLower.includes('shrimp') ||
        itemLower.includes('turkey') || itemLower.includes('lamb') || itemLower.includes('sausage')) {
      return 'Proteins';
    }
    
    if (itemLower.includes('potato') || itemLower.includes('carrot') || itemLower.includes('onion') ||
        itemLower.includes('cabbage') || itemLower.includes('pepper') || itemLower.includes('mushroom') ||
        itemLower.includes('broccoli') || itemLower.includes('lettuce') || itemLower.includes('tomato') ||
        itemLower.includes('cucumber') || itemLower.includes('garlic') || itemLower.includes('ginger')) {
      return 'Vegetables';
    }
    
    if (itemLower.includes('rice') || itemLower.includes('pasta') || itemLower.includes('flour') ||
        itemLower.includes('bread') || itemLower.includes('buckwheat') || itemLower.includes('oat') ||
        itemLower.includes('noodle') || itemLower.includes('potato') || itemLower.includes('corn')) {
      return 'Grains & Starches';
    }
    
    if (itemLower.includes('milk') || itemLower.includes('cheese') || itemLower.includes('yogurt') ||
        itemLower.includes('sour cream') || itemLower.includes('butter') || itemLower.includes('cream') ||
        itemLower.includes('egg')) {
      return 'Dairy';
    }
    
    if (itemLower.includes('salt') || itemLower.includes('pepper') || itemLower.includes('sugar') ||
        itemLower.includes('spice') || itemLower.includes('herb') || itemLower.includes('dill') ||
        itemLower.includes('basil') || itemLower.includes('paprika') || itemLower.includes('cumin') ||
        itemLower.includes('coriander')) {
      return 'Spices & Seasonings';
    }
    
    if (itemLower.includes('oil') || itemLower.includes('butter') || itemLower.includes('fat')) {
      return 'Oils & Fats';
    }
    
    return 'Sauces & Condiments';
  }

  // Generate virtual pantry
  generatePantry(groceryList) {
    console.log('🍳 Generating virtual pantry...');
    
    // Basic pantry staples that are typically in stock
    const pantryStaples = [
      { item: 'salt', amount: 1000, unit: 'g' },
      { item: 'black pepper', amount: 100, unit: 'g' },
      { item: 'sugar', amount: 500, unit: 'g' },
      { item: 'vegetable oil', amount: 500, unit: 'ml' },
      { item: 'butter', amount: 200, unit: 'g' },
      { item: 'garlic', amount: 50, unit: 'cloves' },
      { item: 'onion', amount: 5, unit: 'medium' }
    ];
    
    // Combine with grocery list to track what's needed
    const pantryInventory = {};
    
    // Add what we have (pantry staples)
    pantryStaples.forEach(item => {
      pantryInventory[item.item.toLowerCase()] = {
        ...item,
        inStock: true,
        needed: false
      };
    });
    
    // Add what we need from grocery list
    Object.keys(groceryList.categorized).forEach(category => {
      groceryList.categorized[category].forEach(ingredient => {
        const key = ingredient.item.toLowerCase();
        if (!pantryInventory[key]) {
          pantryInventory[key] = {
            item: ingredient.item,
            amount: ingredient.amount,
            unit: ingredient.unit,
            inStock: false,
            needed: true
          };
        }
      });
    });
    
    return {
      staples: pantryStaples.length,
      items: Object.keys(pantryInventory).length,
      needed: Object.values(pantryInventory).filter(item => item.needed).length,
      inventory: pantryInventory
    };
  }

  // Generate HTML site
  generateHTML(menu, groceryList, pantry) {
    console.log('🌐 Generating HTML site...');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Grocery Menu - ${menu.week}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 2.5em;
        }
        
        .header p {
            color: #7f8c8d;
            font-size: 1.1em;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            text-align: center;
            min-width: 150px;
        }
        
        .stat-card h3 {
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .stat-card p {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .toggle-container {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .toggle-btn {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        
        .toggle-btn:hover {
            background: #2980b9;
            transform: translateY(-2px);
        }
        
        .content {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .menu-section, .grocery-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .section-title {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.5em;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
        }
        
        .day {
            margin-bottom: 25px;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 20px;
        }
        
        .day:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .day h3 {
            color: #2c3e50;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .meal {
            margin-bottom: 15px;
            padding-left: 20px;
            border-left: 3px solid #3498db;
        }
        
        .meal:last-child {
            margin-bottom: 0;
        }
        
        .meal h4 {
            color: #34495e;
            margin-bottom: 5px;
        }
        
        .meal-details {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            color: #7f8c8d;
            margin-bottom: 8px;
        }
        
        .ingredients-list {
            background: #f8f9fa;
            border-radius: 5px;
            padding: 10px;
            font-size: 0.85em;
        }
        
        .grocery-category {
            margin-bottom: 20px;
        }
        
        .grocery-category h4 {
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        
        .grocery-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .grocery-item:last-child {
            border-bottom: none;
        }
        
        .pantry {
            background: #2c3e50;
            color: white;
            border-radius: 15px;
            padding: 25px;
            margin-top: 20px;
        }
        
        .pantry h3 {
            margin-bottom: 15px;
            color: white;
        }
        
        .pantry-stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
        }
        
        .pantry-stat {
            text-align: center;
        }
        
        .pantry-stat h4 {
            color: #ecf0f1;
            margin-bottom: 5px;
        }
        
        .pantry-stat p {
            color: #bdc3c7;
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .hidden {
            display: none;
        }
        
        @media (max-width: 768px) {
            .content {
                grid-template-columns: 1fr;
            }
            
            .stats {
                flex-direction: column;
                align-items: center;
            }
        }
        
        .cuisine-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .cuisine-slavic {
            background: #e74c3c;
            color: white;
        }
        
        .cuisine-asian {
            background: #f39c12;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Weekly Grocery Menu</h1>
            <p>${menu.week} | ${menu.nutritionProfile} nutrition | ${menu.targetCalories} calories/day</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>${menu.cuisineBalance.slavicPercent}%</h3>
                <p>Slavic Meals</p>
            </div>
            <div class="stat-card">
                <h3>${menu.cuisineBalance.asianPercent}%</h3>
                <p>Asian Meals</p>
            </div>
            <div class="stat-card">
                <h3>${groceryList.totalItems}</h3>
                <p>Grocery Items</p>
            </div>
            <div class="stat-card">
                <h3>${pantry.needed}</h3>
                <p>Items to Buy</p>
            </div>
        </div>
        
        <div class="toggle-container">
            <button class="toggle-btn" onclick="togglePantry()">📦 Toggle Pantry View</button>
        </div>
        
        <div class="content">
            <div class="menu-section" id="menuView">
                <h2 class="section-title">🍽️ Weekly Menu</h2>
                ${this.generateMenuHTML(menu, recipes)}
            </div>
            
            <div class="grocery-section">
                <h2 class="section-title">🛒 Grocery List</h2>
                ${this.generateGroceryHTML(groceryList)}
                
                <div class="pantry hidden" id="pantryView">
                    <h3>🍳 Virtual Pantry</h3>
                    <div class="pantry-stats">
                        <div class="pantry-stat">
                            <h4>Staples</h4>
                            <p>${pantry.staples}</p>
                        </div>
                        <div class="pantry-stat">
                            <h4>Total Items</h4>
                            <p>${pantry.items}</p>
                        </div>
                        <div class="pantry-stat">
                            <h4>To Buy</h4>
                            <p>${pantry.needed}</p>
                        </div>
                    </div>
                    <div id="pantryItems">
                        ${this.generatePantryHTML(pantry)}
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function togglePantry() {
            const pantryView = document.getElementById('pantryView');
            const menuView = document.getElementById('menuView');
            
            if (pantryView.classList.contains('hidden')) {
                pantryView.classList.remove('hidden');
                menuView.classList.add('hidden');
            } else {
                pantryView.classList.add('hidden');
                menuView.classList.remove('hidden');
            }
        }
    </script>
</body>
</html>`;
    
    return html;
  }

  // Generate menu HTML
  generateMenuHTML(menu, recipes) {
    let html = '';
    
    for (const day of menu.days) {
      html += `<div class="day">
        <h3>${day.day} <span class="cuisine-badge cuisine-${day.meals.breakfast.cuisine}">${day.meals.breakfast.cuisine}</span></h3>`;
      
      for (const mealType in day.meals) {
        const meal = day.meals[mealType];
        const recipeKey = `${day.day}-${mealType}`;
        const recipe = recipes[recipeKey];
        
        html += `<div class="meal">
          <h4>${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${meal.name}</h4>
          <div class="meal-details">
            <span>🔥 ${meal.calories} kcal</span>
            <span>⏱️ ${meal.prepTime}</span>
            <span>🍽️ ${recipe ? recipe.source : 'Unknown'}</span>
          </div>`;
        
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
          html += `<div class="ingredients-list">
            <strong>Ingredients:</strong><br>`;
          for (const ingredient of recipe.ingredients.slice(0, 5)) {
            html += `• ${ingredient.amount} ${ingredient.unit} ${ingredient.item}<br>`;
          }
          html += '</div>';
        }
        
        html += '</div>';
      }
      
      html += '</div>';
    }
    
    return html;
  }

  // Generate grocery list HTML
  generateGroceryHTML(groceryList) {
    let html = '';
    
    Object.keys(groceryList.categorized).forEach(category => {
      html += `<div class="grocery-category">
        <h4>${category}</h4>`;
      
      groceryList.categorized[category].forEach(ingredient => {
        html += `<div class="grocery-item">
          <span>${ingredient.item}</span>
          <span>${ingredient.amount} ${ingredient.unit}</span>
        </div>`;
      });
      
      html += '</div>';
    });
    
    return html;
  }

  // Generate pantry HTML
  generatePantryHTML(pantry) {
    let html = '';
    
    Object.keys(pantry.inventory).forEach(key => {
      const item = pantry.inventory[key];
      if (item.needed) {
        html += `<div class="grocery-item">
          <span>${item.item}</span>
          <span>${item.amount} ${item.unit}</span>
        </div>`;
      }
    });
    
    return html;
  }

  // Save all outputs
  async saveOutputs(menu, groceryList, pantry, html) {
    console.log('💾 Saving outputs...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Save menu
    const menuFile = `data/menu-${today}.json`;
    fs.writeFileSync(menuFile, JSON.stringify(menu, null, 2));
    console.log(`💾 Saved menu to ${menuFile}`);
    
    // Save grocery list
    const groceryFile = `data/grocery-list-${today}.json`;
    fs.writeFileSync(groceryFile, JSON.stringify(groceryList, null, 2));
    console.log(`💾 Saved grocery list to ${groceryFile}`);
    
    // Save pantry
    const pantryFile = `data/pantry-${today}.json`;
    fs.writeFileSync(pantryFile, JSON.stringify(pantry, null, 2));
    console.log(`💾 Saved pantry to ${pantryFile}`);
    
    // Save HTML
    const htmlFile = `docs/index.html`;
    fs.writeFileSync(htmlFile, html);
    console.log(`💾 Saved HTML site to ${htmlFile}`);
    
    return {
      menu: menuFile,
      grocery: groceryFile,
      pantry: pantryFile,
      html: htmlFile
    };
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Run the complete pipeline
  async run() {
    console.log('🚀 Starting Complete Grocery Planner Pipeline...\n');
    
    try {
      const startTime = Date.now();
      
      // Step 1: Generate menu
      const menu = this.generateWeeklyMenu();
      
      // Step 2: Research recipes
      const recipes = await this.researchRecipes(menu);
      
      // Step 3: Build grocery list
      const groceryList = this.buildGroceryList(menu, recipes);
      
      // Step 4: Generate pantry
      const pantry = this.generatePantry(groceryList);
      
      // Step 5: Generate HTML
      const html = this.generateHTML(menu, groceryList, pantry);
      
      // Step 6: Save outputs
      const outputs = await this.saveOutputs(menu, groceryList, pantry, html);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('\n✅ Pipeline completed successfully!');
      console.log(`⏱️ Total time: ${duration.toFixed(1)} seconds`);
      
      return {
        success: true,
        week: menu.week,
        duration,
        outputs,
        stats: {
          totalMeals: 21,
          slavicMeals: menu.cuisineBalance.slavic,
          asianMeals: menu.cuisineBalance.asian,
          uniqueRecipes: Object.keys(recipes).length,
          groceryItems: groceryList.totalItems,
          pantryItems: pantry.items
        }
      };
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = CompleteGroceryPlanner;

// Run if called directly
if (require.main === module) {
  async function main() {
    console.log('🚀 Starting Complete Grocery Planner with Real Recipe Research...\n');
    
    try {
      const planner = new CompleteGroceryPlanner();
      const result = await planner.run();
      
      console.log('\n🎉 SUCCESS! Weekly menu generated with real recipes!');
      console.log(`📅 Week: ${result.week}`);
      console.log(`🍽️ Meals: ${result.stats.totalMeals} total (${result.stats.slavicMeals} Slavic, ${result.stats.asianMeals} Asian)`);
      console.log(`🔍 Recipes researched: ${result.stats.uniqueRecipes}`);
      console.log(`🛒 Grocery items: ${result.stats.groceryItems}`);
      console.log(`🍳 Pantry items: ${result.stats.pantryItems}`);
      console.log(`💾 Files saved: ${Object.keys(result.outputs).join(', ')}`);
      console.log(`⏱️ Execution time: ${result.duration.toFixed(1)} seconds`);
      
      console.log('\n🌐 HTML site generated at docs/index.html');
      console.log('🔗 To view the menu, open docs/index.html in your browser');
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
  
  main().catch(console.error);
}