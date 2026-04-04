// Complete Grocery Planner Pipeline
// Orchestrates the entire menu generation, recipe research, and site generation process

const fs = require('fs');
const path = require('path');
const MenuGenerator = require('./src/menu-generator');
const RecipeResearcher = require('./src/recipe-researcher');

class GroceryPlannerPipeline {
  constructor(config) {
    this.config = config;
    this.menuGenerator = new MenuGenerator(config);
    this.recipeResearcher = new RecipeResearcher();
    this.weekIdentifier = this.getCurrentWeek();
  }

  // Run the complete pipeline
  async run() {
    console.log('🚀 Starting Grocery Planner Pipeline...');
    console.log(`Week: ${this.weekIdentifier}`);
    console.log(`Nutrition: ${this.config.nutrition}`);
    
    const startTime = Date.now();
    
    try {
      // Step 1: Generate weekly menu
      console.log('\n📋 Step 1: Generating weekly menu...');
      const weeklyMenu = this.menuGenerator.generateWeeklyMenu();
      
      // Validate menu
      const validation = this.menuGenerator.validateMenu(weeklyMenu);
      if (!validation.valid) {
        console.warn('⚠️ Menu validation issues:', validation.issues);
      }
      
      console.log(`✅ Menu generated with ${weeklyMenu.cuisineStats.slavic.percentage}% Slavic, ${weeklyMenu.cuisineStats.asian.percentage}% Asian`);
      console.log(`📊 Daily calories: ${weeklyMenu.nutritionSummary.daily.calories} (target: ${weeklyMenu.nutritionSummary.target.calories})`);
      
      // Step 2: Research recipes using web_search
      console.log('\n🔍 Step 2: Researching recipes...');
      const recipes = await this.recipeResearcher.researchWeeklyRecipes(weeklyMenu);
      
      // Add recipes to menu
      weeklyMenu.recipes = recipes;
      
      // Step 3: Build grocery list
      console.log('\n🛒 Step 3: Building grocery list...');
      const groceryList = this.buildGroceryList(weeklyMenu);
      
      // Step 4: Generate virtual pantry
      console.log('\n🍳 Step 4: Generating virtual pantry...');
      const pantry = this.generatePantry(groceryList);
      
      // Step 5: Generate HTML site
      console.log('\n🌐 Step 5: Generating HTML site...');
      const htmlContent = this.generateHTML(weeklyMenu, groceryList, pantry);
      
      // Step 6: Save all outputs
      console.log('\n💾 Step 6: Saving outputs...');
      await this.saveOutputs(weeklyMenu, groceryList, pantry, htmlContent);
      
      // Step 7: Publish to GitHub
      console.log('\n📤 Step 7: Publishing to GitHub...');
      await this.publishToGitHub();
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('\n✅ Pipeline completed successfully!');
      console.log(`⏱️ Total time: ${duration.toFixed(1)} seconds`);
      
      return {
        success: true,
        week: this.weekIdentifier,
        duration,
        menuStats: {
          totalMeals: 21,
          slavicMeals: weeklyMenu.cuisineStats.slavic.count,
          asianMeals: weeklyMenu.cuisineStats.asian.count,
          uniqueRecipes: Object.keys(recipes).length
        },
        nutrition: {
          dailyCalories: weeklyMenu.nutritionSummary.daily.calories,
          targetCalories: weeklyMenu.nutritionSummary.target.calories,
          deviation: weeklyMenu.nutritionSummary.deviation.percentage
        },
        groceryItems: groceryList.totalItems
      };
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      throw error;
    }
  }

  // Build grocery list from all recipes
  buildGroceryList(weeklyMenu) {
    const ingredients = {};
    const categories = {
      produce: [],
      meat: [],
      dairy: [],
      pantry: [],
      spices: [],
      frozen: [],
      other: []
    };
    
    // Process all recipes
    for (const [recipeKey, recipe] of Object.entries(weeklyMenu.recipes)) {
      for (const ingredient of recipe.ingredients) {
        const key = ingredient.name.toLowerCase();
        
        // Aggregate quantities
        if (ingredients[key]) {
          ingredients[key].amount += ingredient.amount || 1;
        } else {
          ingredients[key] = {
            name: ingredient.name,
            amount: ingredient.amount || 1,
            unit: ingredient.unit || 'pieces',
            recipes: [recipe.name]
          };
        }
      }
    }
    
    // Categorize ingredients
    const categorizedList = [];
    
    for (const [key, ingredient] of Object.entries(ingredients)) {
      const category = this.categorizeIngredient(ingredient.name);
      categorizedList.push({
        ...ingredient,
        category: category,
        isOrganic: Math.random() > 0.7, // Simulate organic status
        notes: this.getIngredientNotes(ingredient.name)
      });
      
      if (categories[category]) {
        categories[category].push(ingredient);
      } else {
        categories.other.push(ingredient);
      }
    }
    
    return {
      week: this.weekIdentifier,
      totalItems: categorizedList.length,
      categories: categories,
      items: categorizedList,
      generatedAt: new Date().toISOString()
    };
  }

  // Categorize ingredient by type
  categorizeIngredient(ingredientName) {
    const lower = ingredientName.toLowerCase();
    
    if (lower.includes('carrot') || lower.includes('onion') || lower.includes('garlic') ||
        lower.includes('potato') || lower.includes('cabbage') || lower.includes('lettuce') ||
        lower.includes('tomato') || lower.includes('cucumber') || lower.includes('pepper') ||
        lower.includes('broccoli') || lower.includes('spinach') || lower.includes('herb')) {
      return 'produce';
    }
    
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') ||
        lower.includes('fish') || lower.includes('shrimp') || lower.includes('meat')) {
      return 'meat';
    }
    
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('yogurt') ||
        lower.includes('butter') || lower.includes('cream') || lower.includes('cottage')) {
      return 'dairy';
    }
    
    if (lower.includes('rice') || lower.includes('pasta') || lower.includes('flour') ||
        lower.includes('oil') || lower.includes('sugar') || lower.includes('salt') ||
        lower.includes('vinegar') || lower.includes('soy') || lower.includes('sauce') ||
        lower.includes('broth') || lower.includes('rice') || lower.includes('noodle')) {
      return 'pantry';
    }
    
    if (lower.includes('spice') || lower.includes('pepper') || lower.includes('cinnamon') ||
        lower.includes('ginger') || lower.includes('garlic powder') || lower.includes('herb')) {
      return 'spices';
    }
    
    if (lower.includes('frozen') || lower.includes('pelmeni') || lower.includes('dumpling')) {
      return 'frozen';
    }
    
    return 'other';
  }

  // Get notes for ingredients
  getIngredientNotes(ingredientName) {
    const lower = ingredientName.toLowerCase();
    
    if (lower.includes('organic')) return 'Organic preferred';
    if (lower.includes('free range')) return 'Free range preferred';
    if (lower.includes('local')) return 'Buy local when possible';
    
    return '';
  }

  // Generate virtual pantry (current stock + needed items)
  generatePantry(groceryList) {
    // Simulated current pantry stock
    const currentStock = {
      produce: ['carrots', 'onions', 'garlic', 'potatoes'],
      meat: ['chicken breast', 'ground beef'],
      dairy: ['milk', 'eggs', 'cheese'],
      pantry: ['rice', 'pasta', 'oil', 'salt', 'sugar'],
      spices: ['black pepper', 'paprika'],
      frozen: ['mixed vegetables'],
      other: ['bread']
    };
    
    const needed = {};
    const lowStock = {};
    
    for (const [category, items] of Object.entries(groceryList.categories)) {
      needed[category] = [];
      lowStock[category] = [];
      
      for (const item of items) {
        const itemName = item.name.toLowerCase();
        const stockCount = this.getItemStockCount(itemName, currentStock[category]);
        
        if (stockCount === 0) {
          needed[category].push(item);
        } else if (stockCount < item.amount / 2) {
          lowStock[category].push({
            ...item,
            currentStock: stockCount
          });
        }
      }
    }
    
    return {
      week: this.weekIdentifier,
      currentStock,
      needed,
      lowStock,
      stockStatus: this.calculateStockStatus(needed),
      generatedAt: new Date().toISOString()
    };
  }

  // Get item stock count from pantry
  getItemStockCount(itemName, categoryStock) {
    const stockItem = categoryStock.find(stock => 
      itemName.includes(stock) || stock.includes(itemName)
    );
    
    return stockItem ? Math.floor(Math.random() * 3) : 0;
  }

  // Calculate overall pantry status
  calculateStockStatus(needed) {
    const totalCategories = Object.keys(needed).length;
    const emptyCategories = Object.values(needed).filter(items => items.length > 0).length;
    
    const status = {
      categoriesWithStock: totalCategories - emptyCategories,
      totalCategories,
      percentageStock: Math.round(((totalCategories - emptyCategories) / totalCategories) * 100),
      isEmpty: emptyCategories === totalCategories,
      isWellStocked: emptyCategories === 0
    };
    
    return status;
  }

  // Generate HTML site
  generateHTML(weeklyMenu, groceryList, pantry) {
    const nutrition = weeklyMenu.nutritionSummary;
    const cuisineStats = weeklyMenu.cuisineStats;
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Menu - ${this.weekIdentifier}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 0;
            text-align: center;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .week-info {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .section {
            background: white;
            margin-bottom: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .section-header {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .section-content {
            padding: 20px;
        }
        
        .meal-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .meal-card {
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s;
        }
        
        .meal-card:hover {
            transform: translateY(-2px);
        }
        
        .meal-header {
            background: ${cuisineStats.slavic.percentage > 50 ? '#e3f2fd' : '#fff3e0'};
            padding: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .meal-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .meal-meta {
            font-size: 0.9rem;
            color: #666;
        }
        
        .meal-details {
            padding: 15px;
        }
        
        .ingredients-list {
            margin-bottom: 15px;
        }
        
        .ingredients-list h4 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .ingredients-list ul {
            list-style: none;
            font-size: 0.9rem;
        }
        
        .ingredients-list li {
            margin-bottom: 5px;
            padding-left: 15px;
            position: relative;
        }
        
        .ingredients-list li:before {
            content: "•";
            color: #667eea;
            position: absolute;
            left: 0;
        }
        
        .instructions {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        
        .grocery-categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        
        .grocery-category {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
        }
        
        .grocery-category h3 {
            margin-bottom: 10px;
            color: #333;
            font-size: 1.1rem;
        }
        
        .grocery-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .grocery-item:last-child {
            border-bottom: none;
        }
        
        .item-name {
            font-weight: 500;
        }
        
        .item-amount {
            color: #667eea;
            font-weight: 600;
        }
        
        .pantry-toggle {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .toggle-btn {
            padding: 8px 16px;
            border: 1px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .toggle-btn.active {
            background: #667eea;
            color: white;
        }
        
        .pantry-section {
            display: none;
        }
        
        .pantry-section.active {
            display: block;
        }
        
        .pantry-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .stock-low {
            color: #f44336;
        }
        
        .stock-empty {
            color: #d32f2f;
            font-weight: bold;
        }
        
        .recipe-link {
            display: inline-block;
            margin-top: 10px;
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
        
        .recipe-link:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .meal-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Weekly Menu Planner</h1>
            <div class="week-info">Week ${this.weekIdentifier} • ${this.config.nutrition} nutrition</div>
        </header>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${cuisineStats.slavic.count}</div>
                <div class="stat-label">Slavic Meals</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${cuisineStats.asian.count}</div>
                <div class="stat-label">Asian Meals</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${nutrition.daily.calories}</div>
                <div class="stat-label">Daily Calories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${groceryList.totalItems}</div>
                <div class="stat-label">Grocery Items</div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2>🍽️ Weekly Meal Plan</h2>
            </div>
            <div class="section-content">
                <div class="meal-grid">
                    ${this.generateMealGrid(weeklyMenu)}
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2>🛒 Grocery List</h2>
            </div>
            <div class="section-content">
                <div class="grocery-categories">
                    ${this.generateGroceryCategories(groceryList)}
                </div>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                <h2>🍳 Virtual Pantry</h2>
            </div>
            <div class="section-content">
                <div class="pantry-toggle">
                    <button class="toggle-btn active" onclick="togglePantry('current')">Current Stock</button>
                    <button class="toggle-btn" onclick="togglePantry('needed')">Need to Buy</button>
                    <button class="toggle-btn" onclick="togglePantry('low')">Low Stock</button>
                </div>
                
                <div id="current-pantry" class="pantry-section active">
                    ${this.generatePantrySection(pantry.currentStock, 'Current Stock', 'stock-good')}
                </div>
                
                <div id="needed-pantry" class="pantry-section">
                    ${this.generatePantryNeeded(pantry.needed)}
                </div>
                
                <div id="low-pantry" class="pantry-section">
                    ${this.generatePantrySection(pantry.lowStock, 'Low Stock', 'stock-low')}
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function togglePantry(type) {
            // Hide all sections
            document.querySelectorAll('.pantry-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all buttons
            document.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(type + '-pantry').classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
    
    return html;
  }

  // Generate meal grid HTML
  generateMealGrid(weeklyMenu) {
    let html = '';
    
    for (const mealType of Object.keys(weeklyMenu.menu)) {
      for (const meal of weeklyMenu.menu[mealType]) {
        const recipeKey = `${meal.day}-${mealType}-${meal.cuisine}-${meal.name}`;
        const recipe = weeklyMenu.recipes[recipeKey];
        
        html += `
        <div class="meal-card">
            <div class="meal-header">
                <div class="meal-title">${meal.name}</div>
                <div class="meal-meta">
                    Day ${meal.day} • ${meal.mealType} • ${meal.cuisine} • ~${meal.estimatedCalories} kcal
                </div>
            </div>
            <div class="meal-details">
                ${recipe ? `
                <div class="ingredients-list">
                    <h4>Ingredients:</h4>
                    <ul>
                        ${recipe.ingredients.slice(0, 5).map(ing => 
                            `<li>${ing.amount} ${ing.unit} ${ing.name}</li>`
                        ).join('')}
                        ${recipe.ingredients.length > 5 ? '<li>... + ' + (recipe.ingredients.length - 5) + ' more</li>' : ''}
                    </ul>
                </div>
                <div class="instructions">
                    <strong>Instructions:</strong> ${recipe.instructions.slice(0, 3).join(' • ')}
                </div>
                <a href="#" class="recipe-link">View Full Recipe →</a>
                ` : '<p>Recipe research pending...</p>'}
            </div>
        </div>`;
      }
    }
    
    return html;
  }

  // Generate grocery categories HTML
  generateGroceryCategories(groceryList) {
    let html = '';
    
    for (const [category, items] of Object.entries(groceryList.categories)) {
      if (items.length > 0) {
        html += `
        <div class="grocery-category">
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length})</h3>
            ${items.map(item => `
                <div class="grocery-item">
                    <span class="item-name">${item.name}</span>
                    <span class="item-amount">${item.amount} ${item.unit}</span>
                </div>
            `).join('')}
        </div>`;
      }
    }
    
    return html;
  }

  // Generate pantry section HTML
  generatePantrySection(pantryData, title, statusClass) {
    const categories = Object.keys(pantryData);
    const hasItems = categories.some(cat => pantryData[cat].length > 0);
    
    if (!hasItems) {
      return `<p style="text-align: center; color: #666; padding: 20px;">No items in ${title.toLowerCase()}</p>`;
    }
    
    let html = '';
    
    for (const [category, items] of Object.entries(pantryData)) {
      if (items.length > 0) {
        html += `
        <div class="grocery-category">
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length})</h3>
            ${items.map(item => `
                <div class="pantry-item ${statusClass}">
                    <span class="item-name">${item}</span>
                    <span class="item-amount">In Stock</span>
                </div>
            `).join('')}
        </div>`;
      }
    }
    
    return html;
  }

  // Generate "need to buy" pantry section
  generatePantryNeeded(needed) {
    const categories = Object.keys(needed);
    const hasItems = categories.some(cat => needed[cat].length > 0);
    
    if (!hasItems) {
      return `<p style="text-align: center; color: #28a745; padding: 20px;">✅ All items in stock!</p>`;
    }
    
    let html = '';
    
    for (const [category, items] of Object.entries(needed)) {
      if (items.length > 0) {
        html += `
        <div class="grocery-category">
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length})</h3>
            ${items.map(item => `
                <div class="pantry-item stock-empty">
                    <span class="item-name">${item.name}</span>
                    <span class="item-amount">${item.amount} ${item.unit}</span>
                </div>
            `).join('')}
        </div>`;
      }
    }
    
    return html;
  }

  // Save all outputs
  async saveOutputs(weeklyMenu, groceryList, pantry, htmlContent) {
    const outputDir = path.join(this.config.output.weeklyDir, this.weekIdentifier);
    
    // Create directories
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save weekly menu
    const menuData = JSON.stringify(weeklyMenu, null, 2);
    fs.writeFileSync(path.join(outputDir, 'menu.json'), menuData);
    
    // Save grocery list
    const groceryData = JSON.stringify(groceryList, null, 2);
    fs.writeFileSync(path.join(outputDir, 'grocery-list.json'), groceryData);
    
    // Save pantry
    const pantryData = JSON.stringify(pantry, null, 2);
    fs.writeFileSync(path.join(outputDir, 'pantry.json'), pantryData);
    
    // Save HTML site
    fs.writeFileSync(path.join(outputDir, 'index.html'), htmlContent);
    
    console.log(`✅ Outputs saved to ${outputDir}`);
  }

  // Publish to GitHub
  async publishToGitHub() {
    try {
      // This would implement git commit and push
      console.log('📤 Publishing to GitHub...');
      
      // For now, just simulate the action
      const outputDir = path.join(this.config.output.weeklyDir, this.weekIdentifier);
      console.log(`📁 Would commit changes from ${outputDir}`);
      console.log(`🔗 Would push to ${this.config.github.repo}`);
      
      return true;
    } catch (error) {
      console.error('❌ GitHub publish failed:', error.message);
      return false;
    }
  }

  // Get current week identifier
  getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }
}

// Main execution
if (require.main === module) {
  const config = require('./config.json');
  const pipeline = new GroceryPlannerPipeline(config);
  
  pipeline.run()
    .then(result => {
      console.log('\n🎉 Pipeline completed successfully!');
      console.log('📊 Summary:', {
        week: result.week,
        duration: result.duration,
        meals: result.menuStats,
        nutrition: result.nutrition,
        groceries: result.groceryItems
      });
    })
    .catch(error => {
      console.error('❌ Pipeline failed:', error.message);
      process.exit(1);
    });
}

module.exports = GroceryPlannerPipeline;