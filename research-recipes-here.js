// Extract unique meals from the menu
const fs = require('fs');
const menu = JSON.parse(fs.readFileSync('/home/stasik5/.openclaw/workspace/grocery-planner/output/menu.json', 'utf8'));

const uniqueMeals = new Set();
for (const [day, meals] of Object.entries(menu)) {
  for (const [mealType, mealData] of Object.entries(meals)) {
    uniqueMeals.add(JSON.stringify({
      name: mealData.name,
      cuisine: mealData.cuisine,
      mealType: mealType,
      calories: mealData.targetCalories
    }));
  }
}

const meals = Array.from(uniqueMeals).map(m => JSON.parse(m));
console.log(`Found ${meals.length} unique meals to research`);
console.log(JSON.stringify(meals, null, 2));
