/**
 * Site Generator - Generates HTML pages for weekly menu
 * WITH VIRTUAL PANTRY DISPLAY (NO NUTRITION TRACKING)
 */

const fs = require('fs');
const path = require('path');
const pantryManager = require('./pantry-manager');

/**
 * Translation mapping from English to Russian
 */
const translations = {
  // Days of week
  'Monday': 'Понедельник',
  'Tuesday': 'Вторник',
  'Wednesday': 'Среда',
  'Thursday': 'Четверг',
  'Friday': 'Пятница',
  'Saturday': 'Суббота',
  'Sunday': 'Воскресенье',

  // Meal types
  'breakfast': 'Завтрак',
  'snack': 'Перекус',
  'dinner': 'Ужин',
  'lunch': 'Обед',

  // Cuisines
  'slavic': 'Славянская',
  'asian': 'Азиатская',
  'european': 'Европейская',
  'mediterranean': 'Средиземноморская',
  'american': 'Американская',
  'italian': 'Итальянская',
  'mexican': 'Мексиканская',
  'indian': 'Индийская',
  'chinese': 'Китайская',
  'japanese': 'Японская',
  'thai': 'Тайская',
  'french': 'Французская',
  'german': 'Немецкая',
  'greek': 'Греческая',

  // UI text
  'Weekly Menu': 'Еженедельное меню',
  'Pantry (Warehouse)': 'Кладовая (Склад)',
  'Weekly ingredient tracking based on menu (not real inventory)': 'Еженедельный учет продуктов на основе меню (не реальный инвентарь)',
  'Show by days': 'Показать по дням',
  'Hide by days': 'Скрыть по дням',
  'Meals for the week (Click any meal for recipe)': 'Блюда на неделю (Нажмите на любое блюдо для рецепта)',
  'Ingredients': 'Ингредиенты',
  'Instructions': 'Инструкции',
  'Full recipe': 'Полный рецепт',
  'Source:': 'Источник:',

  // Common phrases
  'No pantry items to display.': 'Нет продуктов для отображения.',
  'No usage recorded': 'Нет использования',

  // Fallback recipe ingredients
  'Main ingredients vary by recipe': 'Основные ингредиенты зависят от рецепта',
  'Seasonings to taste': 'Специи по вкусу',
  'Cook according to recipe instructions': 'Готовить согласно инструкции рецепта',

  // Fallback recipe instructions
  'Prepare ingredients according to standard cooking methods': 'Подготовьте ингредиенты стандартными методами готовки',
  'Cook until done': 'Готовьте до готовности',
  'Season to taste': 'Посолите и поперчите по вкусу',
  'Serve hot': 'Подавайте горячим'
};

/**
 * Translate text to Russian
 * @param {string} text - English text to translate
 * @returns {string} Russian translation
 */
function translate(text) {
  return translations[text] || text;
}

/**
 * Translate day name
 * @param {string} day - English day name
 * @returns {string} Russian day name
 */
function translateDay(day) {
  return translate(day);
}

/**
 * Translate meal type
 * @param {string} mealType - English meal type
 * @returns {string} Russian meal type
 */
function translateMealType(mealType) {
  return translate(mealType);
}

/**
 * Translate cuisine
 * @param {string} cuisine - English cuisine name
 * @returns {string} Russian cuisine name
 */
function translateCuisine(cuisine) {
  return translate(cuisine);
}

/**
 * Extract recipes from weekly plan for embedding in HTML
 * @param {Object} plan - Weekly meal plan
 * @returns {Object} Recipe data keyed by day-mealType
 */
function extractRecipes(plan) {
  const recipes = {};
  for (const [day, meals] of Object.entries(plan)) {
    for (const [mealType, meal] of Object.entries(meals)) {
      if (meal.recipe) {
        const key = `${day}-${mealType}`;
        recipes[key] = {
          title: meal.name,
          cuisine: meal.cuisine || 'Unknown',
          ingredients: meal.recipe.ingredients || [],
          instructions: meal.recipe.instructions || [],
          nutrition: meal.recipe.nutrition || {},
          source: meal.recipe.source || 'Unknown',
          url: meal.recipe.url || null
        };
      }
    }
  }
  return recipes;
}

/**
 * Generate HTML for the weekly menu page
 * @param {Object} weeklyPlan - Weekly meal plan with recipes
 * @param {Object} groceryList - Organized grocery list
 * @param {Object} pantry - Virtual pantry data (optional)
 * @param {string} weekLabel - Week label (e.g., "2026-W05")
 * @returns {string} Complete HTML document
 */
function generateHTML(weeklyPlan, groceryList, pantry = null, weekLabel) {
  const days = Object.keys(weeklyPlan);
  const mealTypes = ['breakfast', 'snack', 'dinner'];
  const recipesData = extractRecipes(weeklyPlan);

  // Generate pantry display HTML if pantry data is available
  const pantrySection = pantry ? `
    <!-- Virtual Pantry -->
    <section class="section">
      <h2>📦 ${translate('Pantry (Warehouse)')}</h2>
      <p style="color: #94a3b8; margin-bottom: 15px;">
        ${translate('Weekly ingredient tracking based on menu (not real inventory)')}
      </p>
      <button id="toggle-daily" onclick="toggleDaily()">[${translate('Show by days')}]</button>
      <div class="pantry-items">
        ${pantryManager.formatPantryDisplay(pantry, false)}
      </div>
    </section>
  ` : '';

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Еженедельное меню - ${weekLabel}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #e8eaf0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      padding: 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 40px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
    }

    h1 {
      color: #ffffff;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .week-label {
      color: #cbd5e1;
      font-size: 1.1em;
    }

    .section {
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(10px);
      padding: 30px;
      margin-bottom: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .section h2 {
      color: #60a5fa;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #3b82f6;
    }

    /* Meal Grid */
    .meal-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .day-card {
      background: rgba(30, 41, 59, 0.6);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .day-header {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      padding: 15px;
      text-align: center;
      font-weight: bold;
      box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
    }

    .meals {
      padding: 15px;
    }

    .meal {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid rgba(59, 130, 246, 0.2);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      position: relative;
    }

    .meal:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .meal:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
      background: rgba(59, 130, 246, 0.1);
    }

    .meal::after {
      content: '📖';
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 0.8em;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .meal:hover::after {
      opacity: 1;
    }

    .meal-type {
      font-size: 0.85em;
      text-transform: uppercase;
      color: #60a5fa;
      margin-bottom: 5px;
    }

    .meal-name {
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 5px;
    }

    .meal-cuisine {
      font-size: 0.85em;
      color: #94a3b8;
    }

    .meal-calories {
      font-size: 0.85em;
      color: #4ade80;
    }

    /* Grocery List */
    .grocery-category {
      margin-bottom: 25px;
    }

    .grocery-category h3 {
      color: #60a5fa;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(59, 130, 246, 0.3);
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
      background: rgba(15, 23, 42, 0.6);
      border-radius: 4px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }

    .grocery-item input[type="checkbox"] {
      margin-right: 10px;
      cursor: pointer;
    }

    .grocery-item-name {
      flex: 1;
      color: #e8eaf0;
    }

    .grocery-item-qty {
      color: #94a3b8;
      font-size: 0.9em;
    }

    /* Virtual Pantry */
    .pantry-section button {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
      margin-bottom: 15px;
    }

    .pantry-section button:hover {
      background: linear-gradient(135deg, #2563eb 0%, #60a5fa 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .pantry-items {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .pantry-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 15px;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 6px;
      border: 1px solid rgba(59, 130, 246, 0.2);
      transition: all 0.2s ease;
    }

    .pantry-item:hover {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.4);
    }

    .pantry-item .emoji {
      font-size: 1.5em;
    }

    .pantry-item .name {
      flex: 1;
      color: #e8eaf0;
      font-weight: 500;
      overflow: visible;
      white-space: nowrap;
      min-width: 0;
    }

    .pantry-item .amount {
      font-weight: 600;
      font-size: 0.95em;
    }

    .pantry-item .amount.low {
      color: #ef4444;
    }

    .pantry-item .amount.medium {
      color: #eab308;
    }

    .pantry-item .amount.high {
      color: #4ade80;
    }

    .daily-breakdown {
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(15, 23, 42, 0.8);
      border-radius: 4px;
      border-left: 3px solid #3b82f6;
      font-size: 0.85em;
      color: #94a3b8;
      grid-column: 1 / -1;
    }

    .daily-breakdown.hidden {
      display: none;
    }

    /* Modal Popup */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .modal-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 16px;
      padding: 30px;
      max-width: 600px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      position: relative;
      transform: scale(0.9) translateY(20px);
      transition: transform 0.3s ease;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    }

    .modal-overlay.active .modal-content {
      transform: scale(1) translateY(0);
    }

    .modal-close {
      position: absolute;
      top: 15px;
      right: 15px;
      background: rgba(239, 68, 68, 0.2);
      border: 2px solid #ef4444;
      color: #ef4444;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .modal-close:hover {
      background: #ef4444;
      color: #ffffff;
      transform: rotate(90deg);
    }

    .modal-title {
      font-size: 1.8em;
      color: #f1f5f9;
      margin-bottom: 5px;
      margin-right: 40px;
    }

    .modal-cuisine {
      color: #60a5fa;
      font-size: 1.1em;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid rgba(59, 130, 246, 0.3);
    }

    .modal-section {
      margin-bottom: 25px;
    }

    .modal-section h4 {
      color: #60a5fa;
      font-size: 1.1em;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-section ul,
    .modal-section ol {
      padding-left: 20px;
    }

    .modal-section li {
      margin-bottom: 8px;
      color: #cbd5e1;
      line-height: 1.7;
    }

    .modal-source {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid rgba(59, 130, 246, 0.2);
    }

    .modal-source a {
      color: #60a5fa;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 8px 16px;
      background: rgba(59, 130, 246, 0.2);
      border-radius: 20px;
      transition: background 0.2s ease;
    }

    .modal-source a:hover {
      background: rgba(59, 130, 246, 0.4);
    }

    @media (max-width: 768px) {
      .meal-grid {
        grid-template-columns: 1fr;
      }

      .grocery-items {
        grid-template-columns: 1fr;
      }

      .modal-content {
        padding: 20px;
        width: 95%;
        max-height: 90vh;
      }

      .modal-title {
        font-size: 1.4em;
      }

      .modal-close {
        width: 32px;
        height: 32px;
        font-size: 18px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🍽️ ${translate('Weekly Menu')}</h1>
      <div class="week-label">${weekLabel}</div>
    </header>

    <!-- Pantry (shown first as main shopping reference) -->
    ${pantrySection}

    <!-- Meal Grid -->
    <section class="section">
      <h2>${translate('Meals for the week (Click any meal for recipe)')}</h2>
      <div class="meal-grid">
        ${days.map(day => {
          const translatedDay = translateDay(day);

          return `
          <div class="day-card">
            <div class="day-header">${translatedDay}</div>
            <div class="meals">
              ${mealTypes.map(mealType => {
                const meal = weeklyPlan[day][mealType];
                const translatedMealType = translateMealType(mealType);
                const translatedCuisine = translateCuisine(meal.cuisine);
                return `
                  <div class="meal" data-day="${day}" data-meal="${mealType}" onclick="openModal('${day}', '${mealType}')">
                    <div class="meal-type">${translatedMealType}</div>
                    <div class="meal-name">${meal.name}</div>
                    <div class="meal-cuisine">${translatedCuisine || ''}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
        }).join('')}
      </div>
    </section>

    <!-- Grocery List - Hidden (commented out, pantry is now the main reference) -->
    <!--

    <!-- Recipe Modal -->
    <div class="modal-overlay" id="recipeModal">
      <div class="modal-content">
        <button class="modal-close" onclick="closeModal()">&times;</button>
        <h2 class="modal-title" id="modalTitle"></h2>
        <div class="modal-cuisine" id="modalCuisine"></div>

        <div class="modal-section">
          <h4>🥗 ${translate('Ingredients')}</h4>
          <ul id="modalIngredients"></ul>
        </div>

        <div class="modal-section">
          <h4>👨‍🍳 ${translate('Instructions')}</h4>
          <ol id="modalInstructions"></ol>
        </div>

        <div class="modal-source" id="modalSource"></div>
      </div>
    </div>
  </div>

  <script>
    // Recipe data - embedded in the page
    const recipesData = ${JSON.stringify(recipesData)};

    /**
     * Open modal with recipe details
     */
    function openModal(day, mealType) {
      const key = \`\${day}-\${mealType}\`;
      const recipe = recipesData[key];

      if (!recipe) return;

      document.getElementById('modalTitle').textContent = recipe.title;
      document.getElementById('modalCuisine').textContent = recipe.cuisine;

      const ingredientsList = document.getElementById('modalIngredients');
      ingredientsList.innerHTML = (recipe.ingredients || [])
        .map(ing => {
          // Handle both object format {name: "..."} and string format
          const ingText = typeof ing === 'object' && ing.name ? ing.name : String(ing);
          // Translate common fallback ingredients
          const translations = {
            'Main ingredients vary by recipe': 'Основные ингредиенты зависят от рецепта',
            'Seasonings to taste': 'Специи по вкусу',
            'Cook according to recipe instructions': 'Готовить согласно инструкции рецепта'
          };
          return \`<li>\${translations[ingText] || ingText}</li>\`;
        })
        .join('');

      const instructionsList = document.getElementById('modalInstructions');
      instructionsList.innerHTML = (recipe.instructions || [])
        .map((inst, i) => {
          // Translate common fallback instructions
          const translations = {
            'Prepare ingredients according to standard cooking methods': 'Подготовьте ингредиенты стандартными методами готовки',
            'Cook until done': 'Готовьте до готовности',
            'Season to taste': 'Посолите и поперчите по вкусу',
            'Serve hot': 'Подавайте горячим'
          };
          return \`<li>\${translations[inst] || inst}</li>\`;
        })
        .join('');

      const sourceEl = document.getElementById('modalSource');
      if (recipe.url) {
        sourceEl.innerHTML = \`<a href="\${recipe.url}" target="_blank" rel="noopener noreferrer">🔗 ${translate('Full recipe')}</a>\`;
      } else {
        sourceEl.innerHTML = \`<small>${translate('Source:')} \${recipe.source}</small>\`;
      }

      document.getElementById('recipeModal').classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    function closeModal() {
      document.getElementById('recipeModal').classList.remove('active');
      document.body.style.overflow = '';
    }

    /**
     * Toggle daily breakdown in pantry
     */
    function toggleDaily() {
      const breakdowns = document.querySelectorAll('.daily-breakdown');
      const button = document.querySelector('#toggle-daily');

      breakdowns.forEach(el => el.classList.toggle('hidden'));
      button.textContent = breakdowns[0] && breakdowns[0].classList.contains('hidden')
        ? '[${translate('Show by days')}]'
        : '[${translate('Hide by days')}]';
    }

    // Close on overlay click
    document.getElementById('recipeModal').addEventListener('click', (e) => {
      if (e.target.id === 'recipeModal') {
        closeModal();
      }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  </script>
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
