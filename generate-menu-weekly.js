// Generate Weekly Menu Structure
// Creates the menu structure for the upcoming week

const fs = require('fs');
const path = require('path');

class MenuGenerator {
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

  saveMenu(menu) {
    const today = new Date().toISOString().split('T')[0];
    const filename = `data/menu-${today}.json`;
    fs.writeFileSync(filename, JSON.stringify(menu, null, 2));
    console.log(`💾 Saved menu to ${filename}`);
    return filename;
  }
}

// Generate menu
const generator = new MenuGenerator();
const menu = generator.generateWeeklyMenu();
const menuFile = generator.saveMenu(menu);

console.log(`\n✅ Menu generated for ${menu.week}`);
console.log(`📊 Balance: ${menu.cuisineBalance.slavicPercent}% Slavic, ${menu.cuisineBalance.asianPercent}% Asian`);
console.log(`🎯 Target: ${menu.targetCalories} calories/day`);
console.log(`📝 Next step: Research recipes using web_search tool`);