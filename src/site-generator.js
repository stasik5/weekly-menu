/**
 * Site Generator - Generates HTML pages for weekly menu
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate HTML for the weekly menu page
 * @param {Object} weeklyPlan - Weekly meal plan with recipes
 * @param {Object} groceryList - Organized grocery list
 * @param {Object} nutritionSummary - Nutrition summary
 * @param {string} weekLabel - Week label (e.g., "2026-W05")
 * @returns {string} Complete HTML document
 */
function generateHTML(weeklyPlan, groceryList, nutritionSummary, weekLabel) {
  const days = Object.keys(weeklyPlan);
  const mealTypes = ['breakfast', 'snack', 'dinner'];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Menu - ${weekLabel}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f7fa;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h1 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .week-label {
      color: #7f8c8d;
      font-size: 1.1em;
    }

    .section {
      background: white;
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .section h2 {
      color: #2c3e50;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3498db;
    }

    /* Nutrition Summary */
    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .nutrition-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .nutrition-card h3 {
      font-size: 0.9em;
      color: #7f8c8d;
      margin-bottom: 8px;
    }

    .nutrition-card .value {
      font-size: 1.8em;
      font-weight: bold;
      color: #2c3e50;
    }

    .nutrition-card .unit {
      font-size: 0.9em;
      color: #95a5a6;
    }

    .nutrition-flags {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-top: 20px;
      border-radius: 4px;
    }

    .nutrition-flags:empty {
      display: none;
    }

    .valid-badge {
      background: #d4edda;
      color: #155724;
      padding: 8px 16px;
      border-radius: 20px;
      display: inline-block;
      margin-top: 10px;
    }

    /* Meal Grid */
    .meal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .day-card {
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    }

    .day-header {
      background: #3498db;
      color: white;
      padding: 15px;
      text-align: center;
      font-weight: bold;
    }

    .meals {
      padding: 15px;
    }

    .meal {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e9ecef;
    }

    .meal:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .meal-type {
      font-size: 0.85em;
      text-transform: uppercase;
      color: #7f8c8d;
      margin-bottom: 5px;
    }

    .meal-name {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .meal-cuisine {
      font-size: 0.85em;
      color: #95a5a6;
    }

    .meal-calories {
      font-size: 0.85em;
      color: #27ae60;
    }

    /* Grocery List */
    .grocery-category {
      margin-bottom: 25px;
    }

    .grocery-category h3 {
      color: #2c3e50;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e9ecef;
    }

    .grocery-items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 10px;
    }

    .grocery-item {
      display: flex;
      align-items: baseline;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .grocery-item input[type="checkbox"] {
      margin-right: 10px;
      cursor: pointer;
    }

    .grocery-item-name {
      flex: 1;
    }

    .grocery-item-qty {
      color: #7f8c8d;
      font-size: 0.9em;
    }

    /* Recipe Details */
    .recipe-detail {
      background: #fff;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      display: none;
    }

    .recipe-detail.active {
      display: block;
    }

    .recipe-title {
      font-size: 1.3em;
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .recipe-section {
      margin-bottom: 20px;
    }

    .recipe-section h4 {
      color: #34495e;
      margin-bottom: 10px;
    }

    .recipe-section ul,
    .recipe-section ol {
      padding-left: 20px;
    }

    .recipe-section li {
      margin-bottom: 5px;
    }

    .recipe-link {
      color: #3498db;
      text-decoration: none;
    }

    .recipe-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .meal-grid {
        grid-template-columns: 1fr;
      }

      .grocery-items {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🍽️ Weekly Menu</h1>
      <div class="week-label">${weekLabel}</div>
    </header>

    <!-- Nutrition Summary -->
    <section class="section">
      <h2>Nutrition Summary (${nutritionSummary.level} level)</h2>

      <div class="nutrition-grid">
        <div class="nutrition-card">
          <h3>Daily Calories</h3>
          <div class="value">${nutritionSummary.actual.daily.calories}</div>
          <div class="unit">/ ${nutritionSummary.targets.daily.calories} kcal</div>
        </div>
        <div class="nutrition-card">
          <h3>Weekly Calories</h3>
          <div class="value">${nutritionSummary.actual.weekly.calories}</div>
          <div class="unit">kcal total</div>
        </div>
        <div class="nutrition-card">
          <h3>Protein (daily)</h3>
          <div class="value">${nutritionSummary.actual.daily.protein}</div>
          <div class="unit">/ ${nutritionSummary.targets.daily.protein}g</div>
        </div>
        <div class="nutrition-card">
          <h3>Carbs (daily)</h3>
          <div class="value">${nutritionSummary.actual.daily.carbs}</div>
          <div class="unit">/ ${nutritionSummary.targets.daily.carbs}g</div>
        </div>
        <div class="nutrition-card">
          <h3>Fat (daily)</h3>
          <div class="value">${nutritionSummary.actual.daily.fat}</div>
          <div class="unit">/ ${nutritionSummary.targets.daily.fat}g</div>
        </div>
      </div>

      ${nutritionSummary.isValid
        ? '<div class="valid-badge">✅ All nutrition values within range</div>'
        : '<div class="nutrition-flags">' +
          nutritionSummary.validation.daily.flags
            .concat(nutritionSummary.validation.weekly.flags)
            .map(f => `<div>⚠️ ${f.nutrient}: ${f.actual} vs target ${f.target} (${f.deviation}% deviation)</div>`)
            .join('') +
          '</div>'
      }
    </section>

    <!-- Meal Grid -->
    <section class="section">
      <h2>Weekly Meals</h2>
      <div class="meal-grid">
        ${days.map(day => `
          <div class="day-card">
            <div class="day-header">${day}</div>
            <div class="meals">
              ${mealTypes.map(mealType => {
                const meal = weeklyPlan[day][mealType];
                const nutrition = meal.recipe?.nutrition || {};
                return `
                  <div class="meal">
                    <div class="meal-type">${mealType}</div>
                    <div class="meal-name">${meal.name}</div>
                    <div class="meal-cuisine">${meal.cuisine || ''}</div>
                    <div class="meal-calories">~${nutrition.calories || meal.targetCalories} kcal</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </section>

    <!-- Grocery List -->
    <section class="section">
      <h2>Grocery List</h2>
      ${Object.entries(groceryList).map(([category, items]) => {
        if (items.length === 0) return '';
        return `
          <div class="grocery-category">
            <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <div class="grocery-items">
              ${items.map(item => `
                <div class="grocery-item">
                  <input type="checkbox" id="item-${item.name.replace(/\s+/g, '-')}">
                  <label for="item-${item.name.replace(/\s+/g, '-')}" class="grocery-item-name">${item.name}</label>
                  <span class="grocery-item-qty">(${item.quantity})</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </section>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Save HTML to file
 * @param {string} html - HTML content
 * @param {string} outputPath - Output file path
 */
function saveHTML(html, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, html, 'utf8');
}

/**
 * Save recipes as JSON
 * @param {Object} weeklyPlan - Weekly meal plan with recipes
 * @param {string} outputPath - Output file path
 */
function saveRecipesJSON(weeklyPlan, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(weeklyPlan, null, 2), 'utf8');
}

/**
 * Generate week label from date
 * @param {Date} date - Date object
 * @returns {string} Week label (e.g., "2026-W05")
 */
function getWeekLabel(date = new Date()) {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Get ISO week number
 * @param {Date} date - Date object
 * @returns {number} Week number
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = {
  generateHTML,
  saveHTML,
  saveRecipesJSON,
  getWeekLabel,
  getWeekNumber
};
