// Recipe Researcher for Grocery Planner
// Uses web_search to find actual recipes with ingredients and instructions

const fs = require('fs');
const path = require('path');

// Real meal database with searchable names
const REAL_MEALS = {
  breakfast: {
    slavic: [
      { name: 'Buckwheat Porridge', searchQuery: 'buckwheat porridge recipe butter cheese' },
      { name: 'Oatmeal with Honey', searchQuery: 'oatmeal honey nuts recipe' },
      { name: 'Syrniki Pancakes', searchQuery: 'syrniki cheese pancakes recipe sour cream' },
      { name: 'Russian Blini', searchQuery: 'russian blini pancakes recipe jam' },
      { name: 'Scrambled Eggs Herbs', searchQuery: 'scrambled eggs dill herbs recipe' },
      { name: 'Russian Yogurt', searchQuery: 'russian style yogurt berries recipe' },
      { name: 'Tvorog Casserole', searchQuery: 'tvorog cottage cheese casserole recipe' },
      { name: 'Semolina Porridge', searchQuery: 'semolina porridge cinnamon recipe' },
      { name: 'Farina Breakfast', searchQuery: 'farina breakfast milk recipe' },
      { name: 'Cottage Cheese Dessert', searchQuery: 'cottage cheese honey raisins recipe' }
    ],
    asian: [
      { name: 'Congee with Eggs', searchQuery: 'congee recipe eggs century' },
      { name: 'Fried Rice Vegetables', searchQuery: 'fried rice recipe eggs vegetables' },
      { name: 'Steamed Buns Sweet', searchQuery: 'steamed buns recipe sweet filling' },
      { name: 'Rice Porridge Sesame', searchQuery: 'rice porridge recipe sesame ginger' },
      { name: 'Miso Soup Tofu', searchQuery: 'miso soup recipe tofu green onions' },
      { name: 'Dim Sum Breakfast', searchQuery: 'dim sum recipe breakfast platter' },
      { name: 'Rice Noodle Soup', searchQuery: 'rice noodle soup recipe pork' },
      { name: 'Tofu Scramble', searchQuery: 'tofu scramble recipe soy sauce' },
      { name: 'Banana Pancakes', searchQuery: 'banana pancakes recipe coconut' },
      { name: 'Red Bean Buns', searchQuery: 'red bean paste buns recipe' }
    ]
  },
  snack: {
    slavic: [
      { name: 'Cottage Cheese Apple', searchQuery: 'cottage cheese apple slices recipe' },
      { name: 'Yogurt Granola', searchQuery: 'yogurt honey granola recipe' },
      { name: 'Cheese Cucumber Sandwiches', searchQuery: 'cheese cucumber sandwiches recipe' },
      { name: 'Pickled Vegetables', searchQuery: 'pickled vegetables rye bread recipe' },
      { name: 'Varenyky Dumplings', searchQuery: 'varenyky dumplings recipe sour cream' },
      { name: 'Blini Smoked Salmon', searchQuery: 'blini recipe smoked salmon' },
      { name: 'Cheese Pancakes', searchQuery: 'cheese pancakes recipe russian' },
      { name: 'Rye Crackers Cheese', searchQuery: 'rye crackers cheese recipe' },
      { name: 'Pickled Vegetables Platter', searchQuery: 'pickled tomatoes cucumbers recipe' },
      { name: 'Kvass Traditional', searchQuery: 'kvass traditional drink recipe' }
    ],
    asian: [
      { name: 'Edamame Sea Salt', searchQuery: 'edamame recipe sea salt' },
      { name: 'Seaweed Snacks Wasabi', searchQuery: 'seaweed snacks wasabi recipe' },
      { name: 'Mango Sticky Rice', searchQuery: 'mango sticky rice recipe' },
      { name: 'Pickled Ginger Sesame', searchQuery: 'pickled ginger sesame recipe' },
      { name: 'Spring Rolls Chili', searchQuery: 'spring rolls recipe sweet chili' },
      { name: 'Mochi Red Bean', searchQuery: 'mochi red bean paste recipe' },
      { name: 'Edamame Hummus', searchQuery: 'edamame hummus recipe vegetables' },
      { name: 'Asian Pear Chili', searchQuery: 'asian pear chili salt recipe' },
      { name: 'Gyoza Soy Sauce', searchQuery: 'gyoza recipe soy dipping sauce' },
      { name: 'Tempura Vegetables', searchQuery: 'tempura vegetables recipe' }
    ]
  },
  dinner: {
    slavic: [
      { name: 'Borscht Beetroot', searchQuery: 'borscht beetroot recipe smetana' },
      { name: 'Chicken Noodle Soup', searchQuery: 'chicken noodle soup dill recipe' },
      { name: 'Beef Stroganoff', searchQuery: 'beef stroganoff recipe mashed potatoes' },
      { name: 'Pelmeni Siberian', searchQuery: 'pelmeni siberian dumplings recipe butter' },
      { name: 'Cabbage Rolls', searchQuery: 'cabbage rolls recipe meat rice' },
      { name: 'Solyanka Fish Soup', searchQuery: 'solyanka fish soup recipe lemon' },
      { name: 'Golubtsy Stuffed', searchQuery: 'golubtsy stuffed cabbage recipe' },
      { name: 'Zharkoe Meat Stew', searchQuery: 'zharkoe meat stew recipe potatoes' },
      { name: 'Kotleti Patties', searchQuery: 'kotleti meat patties recipe mashed potatoes' },
      { name: 'Shchi Cabbage Soup', searchQuery: 'shchi cabbage soup recipe smetana' }
    ],
    asian: [
      { name: 'Chicken Teriyaki', searchQuery: 'chicken teriyaki recipe rice' },
      { name: 'Pad Thai Shrimp', searchQuery: 'pad thai recipe shrimp peanuts' },
      { name: 'Pho Beef Herbs', searchQuery: 'pho recipe beef herbs' },
      { name: 'Bibimbap Vegetables', searchQuery: 'bibimbap recipe mixed vegetables' },
      { name: 'Green Curry', searchQuery: 'green curry recipe coconut milk' },
      { name: 'Korean BBQ Ribs', searchQuery: 'korean bbq short ribs recipe' },
      { name: 'Sushi Platter', searchQuery: 'sushi platter recipe miso soup' },
      { name: 'Ramen Pork', searchQuery: 'ramen recipe pork eggs' },
      { name: 'Tom Yum Seafood', searchQuery: 'tom yum soup recipe seafood' },
      { name: 'Stir Fry Noodles', searchQuery: 'stir fried noodles recipe vegetables' }
    ]
  }
};

class RecipeResearcher {
  constructor() {
    this.cache = new Map();
    this.maxRetries = 3;
    this.concurrentSearches = 3; // Limit concurrent searches
  }

  // Research recipes for a weekly menu
  async researchWeeklyRecipes(weeklyMenu) {
    console.log('Starting recipe research for weekly menu...');
    
    const recipes = {};
    const mealQueue = this.buildMealQueue(weeklyMenu);
    
    // Process meals in batches to limit concurrent searches
    for (let i = 0; i < mealQueue.length; i += this.concurrentSearches) {
      const batch = mealQueue.slice(i, i + this.concurrentSearches);
      const batchResults = await Promise.all(
        batch.map(meal => this.researchSingleMeal(meal))
      );
      
      // Store results
      batchResults.forEach((result, index) => {
        const meal = batch[index];
        recipes[`${meal.day}-${meal.mealType}-${meal.cuisine}-${meal.name}`] = result;
      });
      
      console.log(`Processed batch ${Math.floor(i / this.concurrentSearches) + 1}/${Math.ceil(mealQueue.length / this.concurrentSearches)}`);
    }
    
    console.log('Recipe research completed');
    return recipes;
  }

  // Build queue of all meals to research
  buildMealQueue(weeklyMenu) {
    const queue = [];
    
    for (const mealType of Object.keys(weeklyMenu.menu)) {
      for (const meal of weeklyMenu.menu[mealType]) {
        queue.push({
          day: meal.day,
          mealType: mealType,
          cuisine: meal.cuisine,
          name: meal.name,
          searchQuery: this.getSearchQuery(mealType, meal.cuisine, meal.name)
        });
      }
    }
    
    return queue;
  }

  // Get search query for a specific meal
  getSearchQuery(mealType, cuisine, mealName) {
    // Find the meal in our database
    const category = REAL_MEALS[mealType];
    if (!category) return `${mealName} recipe ingredients`;
    
    const cuisineCategory = category[cuisine];
    if (!cuisineCategory) return `${mealName} recipe ingredients`;
    
    const meal = cuisineCategory.find(m => m.name === mealName);
    return meal ? meal.searchQuery : `${mealName} recipe ingredients`;
  }

  // Research a single meal
  async researchSingleMeal(meal) {
    const cacheKey = `${meal.mealType}-${meal.cuisine}-${meal.name}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached recipe for ${meal.name}`);
      return this.cache.get(cacheKey);
    }
    
    console.log(`Researching recipe for ${meal.name}...`);
    
    // Build search query
    const query = `${meal.searchQuery} ingredients`;
    console.log(`Searching: ${query}`);
    
    try {
      // Use web_search to find recipes
      const searchResults = await this.searchRecipes(query);
      
      if (searchResults.length === 0) {
        console.log(`No recipes found for ${meal.name}, using fallback`);
        return this.createFallbackRecipe(meal);
      }
      
      // Select best recipe
      const bestRecipe = await this.selectBestRecipe(searchResults, meal);
      
      // Parse and enrich recipe
      const parsedRecipe = await this.parseRecipe(bestRecipe, meal);
      
      // Cache the result
      this.cache.set(cacheKey, parsedRecipe);
      
      return parsedRecipe;
      
    } catch (error) {
      console.error(`Error researching ${meal.name}:`, error.message);
      console.log(`Using fallback recipe for ${meal.name}`);
      return this.createFallbackRecipe(meal);
    }
  }

  // Search for recipes using web_search
  async searchRecipes(query) {
    // This would use the web_search tool, but for now we'll simulate it
    // In the actual implementation, this would call:
    // return web_search(query, { count: 5 });
    
    // Simulated search results for development
    console.log(`[SIMULATED SEARCH] Query: ${query}`);
    
    // For now, return empty array to be implemented with actual web_search
    return [];
  }

  // Select the best recipe from search results
  async selectBestRecipe(searchResults, meal) {
    if (searchResults.length === 0) {
      throw new Error('No recipes found');
    }
    
    // For now, select the first result
    // In implementation, would score based on:
    // - Recipe rating/reviews
    // - Ingredient completeness
    // - Instructions clarity
    // - Cuisine authenticity
    
    return searchResults[0];
  }

  // Parse recipe from web source
  async parseRecipe(recipeSource, meal) {
    // This would parse actual recipe data from web sources
    // For now, create a structured recipe from our database
    
    return {
      name: meal.name,
      cuisine: meal.cuisine,
      mealType: meal.mealType,
      day: meal.day,
      source: recipeSource.source || 'Unknown',
      url: recipeSource.url || '',
      estimatedCalories: this.estimateCalories(meal.mealType, meal.name),
      ingredients: this.getEstimatedIngredients(meal.mealType, meal.cuisine, meal.name),
      instructions: this.getEstimatedInstructions(meal.mealType, meal.cuisine, meal.name),
      prepTime: this.estimatePrepTime(meal.mealType, meal.name),
      cookTime: this.estimateCookTime(meal.mealType, meal.name),
      servings: 2, // For 2 people
      difficulty: this.estimateDifficulty(meal.mealType, meal.name),
      tags: this.getTags(meal.mealType, meal.cuisine, meal.name)
    };
  }

  // Create fallback recipe when web search fails
  createFallbackRecipe(meal) {
    return {
      name: meal.name,
      cuisine: meal.cuisine,
      mealType: meal.mealType,
      day: meal.day,
      source: 'Fallback Template',
      url: '',
      estimatedCalories: this.estimateCalories(meal.mealType, meal.name),
      ingredients: this.getEstimatedIngredients(meal.mealType, meal.cuisine, meal.name),
      instructions: this.getEstimatedInstructions(meal.mealType, meal.cuisine, meal.name),
      prepTime: this.estimatePrepTime(meal.mealType, meal.name),
      cookTime: this.estimateCookTime(meal.mealType, meal.name),
      servings: 2,
      difficulty: this.estimateDifficulty(meal.mealType, meal.name),
      tags: this.getTags(meal.mealType, meal.cuisine, meal.name)
    };
  }

  // Estimate calories based on meal type
  estimateCalories(mealType, mealName) {
    const baseCalories = {
      breakfast: 450,
      snack: 250,
      dinner: 800
    };
    
    // Adjust based on meal name complexity
    let multiplier = 1.0;
    if (mealName.toLowerCase().includes('stroganoff') || 
        mealName.toLowerCase().includes('bbq') ||
        mealName.toLowerCase().includes('curry')) {
      multiplier = 1.3;
    } else if (mealName.toLowerCase().includes('soup') || 
               mealName.toLowerCase().includes('porridge')) {
      multiplier = 0.8;
    }
    
    return Math.round(baseCalories[mealType] * multiplier);
  }

  // Get estimated ingredients for a meal
  getEstimatedIngredients(mealType, cuisine, mealName) {
    const baseIngredients = {
      breakfast: {
        slavic: ['buckwheat', 'milk', 'butter', 'cheese', 'honey', 'eggs', 'flour', 'sour cream'],
        asian: ['rice', 'eggs', 'vegetables', 'soy sauce', 'sesame oil', 'ginger', 'green onions']
      },
      snack: {
        slavic: ['cottage cheese', 'apple', 'bread', 'cucumber', 'pickles', 'yogurt', 'honey'],
        asian: ['edamame', 'seaweed', 'mango', 'ginger', 'chili', 'rice paper', 'tofu']
      },
      dinner: {
        slavic: ['beef/pork', 'potatoes', 'cabbage', 'carrots', 'onions', 'broth', 'sour cream', 'dill'],
        asian: ['chicken/pork', 'rice noodles', 'vegetables', 'coconut milk', 'spices', 'herbs', 'rice']
      }
    };
    
    const ingredients = baseIngredients[mealType][cuisine] || [];
    
    // Add specific ingredients based on meal name
    if (mealName.toLowerCase().includes('teriyaki')) {
      ingredients.push('teriyaki sauce', 'sesame seeds');
    }
    if (mealName.toLowerCase().includes('stroganoff')) {
      ingredients.push('mushrooms', 'flour', 'cream');
    }
    if (mealName.toLowerCase().includes('soup')) {
      ingredients.push('broth', 'herbs');
    }
    
    return ingredients.map(ing => ({
      name: ing,
      amount: this.estimateAmount(ing, mealType),
      unit: this.estimateUnit(ing, mealType)
    }));
  }

  // Get estimated instructions for a meal
  getEstimatedInstructions(mealType, cuisine, mealName) {
    const baseInstructions = {
      breakfast: {
        slavic: [
          'Prepare grains according to package directions',
          'Add butter and cheese',
          'Serve with honey or sour cream',
          'Garnish with fresh herbs if desired'
        ],
        asian: [
          'Cook rice or noodles according to directions',
          'Prepare vegetables and protein',
          'Season with soy sauce and spices',
          'Steam or stir-fry until tender'
        ]
      },
      snack: {
        slavic: [
          'Slice cheese and prepare vegetables',
          'Arrange on bread or plate',
          'Season with herbs and salt',
          'Serve with yogurt or sour cream'
        ],
        asian: [
          'Prepare vegetables and protein',
          'Season with spices and sauces',
          'Steam or lightly fry',
          'Serve with dipping sauce'
        ]
      },
      dinner: {
        slavic: [
          'Chop vegetables and meat',
          'Sauté onions and aromatics',
          'Add main ingredients and broth',
          'Simmer until tender, finish with sour cream'
        ],
        asian: [
          'Prepare all ingredients',
          'Heat wok or large pan',
          'Stir-fry protein first, then vegetables',
          'Add sauce and finish with herbs'
        ]
      }
    };
    
    return baseInstructions[mealType][cuisine] || [
      'Prepare all ingredients',
      'Cook according to recipe',
      'Season to taste',
      'Serve hot'
    ];
  }

  // Estimate preparation time
  estimatePrepTime(mealType, mealName) {
    const baseTimes = {
      breakfast: 15,
      snack: 10,
      dinner: 30
    };
    
    let time = baseTimes[mealType];
    
    // Adjust based on complexity
    if (mealName.toLowerCase().includes('dumplings') || 
        mealName.toLowerCase().includes('stuffed')) {
      time += 20;
    }
    
    return `${time} minutes`;
  }

  // Estimate cooking time
  estimateCookTime(mealType, mealName) {
    const baseTimes = {
      breakfast: 20,
      snack: 10,
      dinner: 45
    };
    
    let time = baseTimes[mealType];
    
    // Adjust based on complexity
    if (mealName.toLowerCase().includes('soup') || 
        mealName.toLowerCase().includes('stew')) {
      time += 30;
    }
    
    return `${time} minutes`;
  }

  // Estimate difficulty
  estimateDifficulty(mealType, mealName) {
    if (mealName.toLowerCase().includes('dumplings') ||
        mealName.toLowerCase().includes('stuffed') ||
        mealName.toLowerCase().includes('teriyaki')) {
      return 'medium';
    }
    return 'easy';
  }

  // Get tags for recipe
  getTags(mealType, cuisine, mealName) {
    const tags = [mealType, cuisine];
    
    if (mealName.toLowerCase().includes('soup')) tags.push('soup');
    if (mealName.toLowerCase().includes('stew')) tags.push('stew');
    if (mealName.toLowerCase().includes('noodle')) tags.push('noodles');
    if (mealName.toLowerCase().includes('rice')) tags.push('rice');
    if (mealName.toLowerCase().includes('pancake')) tags.push('pancake');
    if (mealName.toLowerCase().includes('dumpling')) tags.push('dumpling');
    
    return tags;
  }

  // Estimate ingredient amount
  estimateAmount(ingredient, mealType) {
    const amounts = {
      'rice/noodles': 200,
      'meat/protein': 150,
      'vegetables': 200,
      'dairy': 100,
      'grains': 50,
      'spices': 5,
      'oil': 15,
      'eggs': 2
    };
    
    // Default amounts based on meal type
    if (mealType === 'breakfast') {
      return amounts['grains'] || amounts['dairy'] || 50;
    } else if (mealType === 'snack') {
      return amounts['dairy'] || amounts['vegetables'] || 50;
    } else {
      return amounts['meat/protein'] || amounts['vegetables'] || 100;
    }
  }

  // Estimate ingredient unit
  estimateUnit(ingredient, mealType) {
    if (ingredient.includes('egg')) return 'pieces';
    if (ingredient.includes('spice') || ingredient.includes('herb')) return 'grams';
    if (ingredient.includes('oil') || ingredient.includes('sauce')) return 'ml';
    return 'grams';
  }
}

module.exports = RecipeResearcher;