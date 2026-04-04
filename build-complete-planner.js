// Build Complete Grocery List and Generate HTML Site
// Creates the final grocery list, pantry inventory, and HTML site

const fs = require('fs');
const path = require('path');

class GroceryPlannerBuilder {
  constructor() {
    this.config = {
      nutrition: 'medium',
      targetCalories: 4000,
      outputDir: './docs'
    };
  }

  // Load menu and recipes
  loadMenuAndRecipes() {
    const menuFile = 'data/menu-2026-03-28.json';
    const recipesFile = 'data/recipes-2026-03-28.json';
    
    const menu = JSON.parse(fs.readFileSync(menuFile, 'utf8'));
    const recipes = JSON.parse(fs.readFileSync(recipesFile, 'utf8'));
    
    return { menu, recipes };
  }

  // Update recipes with real ingredients from web search
  updateRecipesWithRealData(menu, recipes) {
    console.log('🔍 Updating recipes with real ingredients...');
    
    // Real recipe data from web search
    const realRecipes = {
      'Monday-breakfast': {
        recipeName: 'Russian Blini',
        source: 'https://www.allrecipes.com/recipe/260537/easy-blini-russian-pancake/',
        cuisine: 'slavic',
        prepTime: '20 min',
        calories: 600,
        ingredients: [
          { item: 'all-purpose flour', amount: 200, unit: 'g' },
          { item: 'milk', amount: 300, unit: 'ml' },
          { item: 'eggs', amount: 2, unit: 'large' },
          { item: 'butter', amount: 30, unit: 'g' },
          { item: 'salt', amount: 1, unit: 'tsp' },
          { item: 'baking powder', amount: 1, unit: 'tsp' },
          { item: 'sour cream', amount: 50, unit: 'g' },
          { item: 'jam or honey', amount: 2, unit: 'tbsp' }
        ],
        instructions: 'Mix dry ingredients, add wet ingredients, cook on medium heat until golden. Serve with sour cream.',
        url: 'https://www.allrecipes.com/recipe/260537/easy-blini-russian-pancake/'
      },
      
      'Monday-lunch': {
        recipeName: 'Buckwheat with Mushrooms',
        source: 'Traditional recipe',
        cuisine: 'slavic',
        prepTime: '30 min',
        calories: 800,
        ingredients: [
          { item: 'buckwheat', amount: 150, unit: 'g' },
          { item: 'mushrooms', amount: 200, unit: 'g' },
          { item: 'onion', amount: 1, unit: 'medium' },
          { item: 'butter', amount: 30, unit: 'g' },
          { item: 'vegetable oil', amount: 1, unit: 'tbsp' },
          { item: 'salt', amount: 1, unit: 'tsp' },
          { item: 'garlic', amount: 2, unit: 'cloves' }
        ],
        instructions: 'Cook buckwheat according to package directions. Sauté mushrooms and onions in butter. Combine and season.',
        url: null
      },
      
      'Monday-dinner': {
        recipeName: 'Beef Pho',
        source: 'Traditional Vietnamese',
        cuisine: 'asian',
        prepTime: '60 min',
        calories: 900,
        ingredients: [
          { item: 'beef sirloin', amount: 400, unit: 'g' },
          { item: 'rice noodles', amount: 200, unit: 'g' },
          { item: 'beef broth', amount: 1000, unit: 'ml' },
          { item: 'star anise', amount: 2, unit: 'pieces' },
          { item: 'cinnamon stick', amount: 1, unit: 'stick' },
          { item: 'fish sauce', amount: 2, unit: 'tbsp' },
          { item: 'lime', amount: 1, unit: 'whole' },
          { item: 'bean sprouts', amount: 100, unit: 'g' },
          { item: 'thai basil', amount: 20, unit: 'g' }
        ],
        instructions: 'Simmer broth with spices. Cook noodles. Slice beef thin, add to hot broth. Serve with herbs and lime.',
        url: null
      },
      
      'Tuesday-lunch': {
        recipeName: 'Chicken Kiev',
        source: 'https://www.allrecipes.com/recipe/236703/chef-johns-chicken-kiev/',
        cuisine: 'slavic',
        prepTime: '45 min',
        calories: 850,
        ingredients: [
          { item: 'chicken breasts', amount: 4, unit: 'large' },
          { item: 'butter', amount: 100, unit: 'g' },
          { item: 'garlic', amount: 4, unit: 'cloves' },
          { item: 'fresh parsley', amount: 20, unit: 'g' },
          { item: 'salt', amount: 1, unit: 'tsp' },
          { item: 'black pepper', amount: 1, unit: 'tsp' },
          { item: 'breadcrumbs', amount: 100, unit: 'g' },
          { item: 'eggs', amount: 2, unit: 'large' },
          { item: 'flour', amount: 50, unit: 'g' }
        ],
        instructions: 'Make garlic butter filling. Stuff chicken breasts. Bread and fry until golden.',
        url: 'https://www.allrecipes.com/recipe/236703/chef-johns-chicken-kiev/'
      },
      
      'Monday-dinner-correction': {
        recipeName: 'Kung Pao Chicken',
        source: 'https://thewoksoflife.com/kung-pao-chicken/',
        cuisine: 'asian',
        prepTime: '30 min',
        calories: 850,
        ingredients: [
          { item: 'chicken breast', amount: 500, unit: 'g' },
          { item: 'peanuts', amount: 80, unit: 'g' },
          { item: 'dried chili peppers', amount: 6, unit: 'whole' },
          { item: 'vegetable oil', amount: 3, unit: 'tbsp' },
          { item: 'soy sauce', amount: 3, unit: 'tbsp' },
          { item: 'rice vinegar', amount: 2, unit: 'tbsp' },
          { item: 'sugar', amount: 1, unit: 'tbsp' },
          { item: 'garlic', amount: 3, unit: 'cloves' },
          { item: 'green onions', amount: 30, unit: 'g' }
        ],
        instructions: 'Stir-fry chicken, add vegetables and sauce. Top with peanuts. Serve over rice.',
        url: 'https://thewoksoflife.com/kung-pao-chicken/'
      },
      
      'Wednesday-dinner': {
        recipeName: 'Thai Green Curry',
        source: 'https://hot-thai-kitchen.com/green-curry-new-2/',
        cuisine: 'asian',
        prepTime: '35 min',
        calories: 900,
        ingredients: [
          { item: 'chicken thighs', amount: 500, unit: 'g' },
          { item: 'green curry paste', amount: 3, unit: 'tbsp' },
          { item: 'coconut milk', amount: 400, unit: 'ml' },
          { item: 'eggplant', amount: 200, unit: 'g' },
          { item: 'snow peas', amount: 150, unit: 'g' },
          { item: 'fish sauce', amount: 2, unit: 'tbsp' },
          { item: 'thai basil', amount: 20, unit: 'g' },
          { item: 'rice', amount: 200, unit: 'g' },
          { item: 'lime', amount: 1, unit: 'whole' }
        ],
        instructions: 'Simmer curry paste in coconut milk. Add chicken and vegetables. Serve over rice with basil.',
        url: 'https://hot-thai-kitchen.com/green-curry-new-2/'
      }
    };
    
    // Update recipes with real data where available
    Object.keys(realRecipes).forEach(key => {
      if (recipes[key]) {
        recipes[key] = { ...recipes[key], ...realRecipes[key] };
        console.log(`✅ Updated ${key} with real ingredients`);
      }
    });
    
    return recipes;
  }

  // Build grocery list from all recipes
  buildGroceryList(menu, recipes) {
    console.log('🛒 Building grocery list...');
    
    const allIngredients = {};
    
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
    const categories = ['Proteins', 'Vegetables', 'Grains & Starches', 'Dairy', 'Spices & Seasonings', 'Oils & Fats', 'Sauces & Condiments'];
    
    categories.forEach(category => {
      if (categorized[category]) {
        sortedGroceryList[category] = categorized[category].sort((a, b) => a.item.localeCompare(b.item));
      }
    });
    
    const totalItems = Object.keys(allIngredients).length;
    
    console.log(`🛒 Grocery list built with ${totalItems} unique items`);
    
    return {
      totalItems,
      categorized: sortedGroceryList,
      timestamp: new Date().toISOString(),
      ingredients: allIngredients
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
      cup: 240,
      tbsp: 15,
      tsp: 5,
      oz: 28,
      lb: 453,
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
        itemLower.includes('cucumber') || itemLower.includes('garlic') || itemLower.includes('ginger') ||
        itemLower.includes('eggplant') || itemLower.includes('snow peas') || itemLower.includes('bean sprouts')) {
      return 'Vegetables';
    }
    
    if (itemLower.includes('rice') || itemLower.includes('pasta') || itemLower.includes('flour') ||
        itemLower.includes('bread') || itemLower.includes('buckwheat') || itemLower.includes('oat') ||
        itemLower.includes('noodle') || itemLower.includes('corn')) {
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
        itemLower.includes('cinnamon') || itemLower.includes('star anise')) {
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
    
    // Basic pantry staples
    const pantryStaples = [
      { item: 'salt', amount: 1000, unit: 'g' },
      { item: 'black pepper', amount: 100, unit: 'g' },
      { item: 'sugar', amount: 500, unit: 'g' },
      { item: 'vegetable oil', amount: 500, unit: 'ml' },
      { item: 'garlic', amount: 50, unit: 'cloves' }
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
    
    const html = `<!DOCTYPE html>
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
  saveOutputs(menu, groceryList, pantry, html, recipes) {
    console.log('💾 Saving outputs...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Save updated menu with real recipes
    const menuFile = `data/menu-with-recipes-${today}.json`;
    fs.writeFileSync(menuFile, JSON.stringify(menu, null, 2));
    console.log(`💾 Saved menu with recipes to ${menuFile}`);
    
    // Save grocery list
    const groceryFile = `data/grocery-list-${today}.json`;
    fs.writeFileSync(groceryFile, JSON.stringify(groceryList, null, 2));
    console.log(`💾 Saved grocery list to ${groceryFile}`);
    
    // Save pantry
    const pantryFile = `data/pantry-${today}.json`;
    fs.writeFileSync(pantryFile, JSON.stringify(pantry, null, 2));
    console.log(`💾 Saved pantry to ${pantryFile}`);
    
    // Save recipes
    const recipesFile = `data/recipes-with-real-data-${today}.json`;
    fs.writeFileSync(recipesFile, JSON.stringify(recipes, null, 2));
    console.log(`💾 Saved updated recipes to ${recipesFile}`);
    
    // Save HTML
    const htmlFile = `docs/index.html`;
    fs.writeFileSync(htmlFile, html);
    console.log(`💾 Saved HTML site to ${htmlFile}`);
    
    return {
      menu: menuFile,
      grocery: groceryFile,
      pantry: pantryFile,
      recipes: recipesFile,
      html: htmlFile
    };
  }

  // Run the complete build process
  run() {
    console.log('🚀 Starting Complete Grocery Planner Build...\n');
    
    try {
      const startTime = Date.now();
      
      // Step 1: Load menu and recipes
      const { menu, recipes } = this.loadMenuAndRecipes();
      
      // Step 2: Update recipes with real ingredients
      const updatedRecipes = this.updateRecipesWithRealData(menu, recipes);
      
      // Step 3: Build grocery list
      const groceryList = this.buildGroceryList(menu, updatedRecipes);
      
      // Step 4: Generate pantry
      const pantry = this.generatePantry(groceryList);
      
      // Step 5: Generate HTML
      const html = this.generateHTML(menu, groceryList, pantry, updatedRecipes);
      
      // Step 6: Save outputs
      const outputs = this.saveOutputs(menu, groceryList, pantry, html, updatedRecipes);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('\n✅ Build completed successfully!');
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
          groceryItems: groceryList.totalItems,
          pantryItems: pantry.items,
          recipesUpdated: Object.keys(updatedRecipes).length
        }
      };
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      throw error;
    }
  }
}

// Export for use in other modules
module.exports = GroceryPlannerBuilder;

// Run if called directly
if (require.main === module) {
  async function main() {
    console.log('🚀 Starting Complete Grocery Planner Build...\n');
    
    try {
      const builder = new GroceryPlannerBuilder();
      const result = await builder.run();
      
      console.log('\n🎉 SUCCESS! Complete grocery planner built!');
      console.log(`📅 Week: ${result.week}`);
      console.log(`🍽️ Meals: ${result.stats.totalMeals} total (${result.stats.slavicMeals} Slavic, ${result.stats.asianMeals} Asian)`);
      console.log(`🔍 Recipes updated: ${result.stats.recipesUpdated}`);
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