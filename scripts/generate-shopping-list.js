#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read recipes
const recipesPath = process.argv[2] || './output/weekly/2026-W09/recipes.json';
const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));

// Ingredient categories with normalized keywords
const categoryKeywords = {
  '🥬 Овощи': [
    'картофель', 'морковь', 'лук репчатый', 'чеснок', 'капуста', 'свекла', 'помидоры', 
    'огурцы', 'перец болгарский', 'зеленый лук', 'ростки фасоли', 'горошек зеленый'
  ],
  '🥩 Мясо и рыба': [
    'говядина', 'свинина', 'куриное филе', 'фарш', 'креветки'
  ],
  '🧀 Молочные продукты': [
    'молоко', 'сметана', 'сыр твердый', 'сыр мягкий', 'творог', 'масло сливочное', 'яйца'
  ],
  '🌾 Крупы и мучное': [
    'рис', 'гречка', 'мука', 'крупа', 'лапша яичная', 'хлеб', 'пельмени', 'рисовая лапша'
  ],
  '🍜 Азиатские продукты': [
    'тофу', 'соевый соус', 'рыбный соус', 'кунжутное масло', 'кунжут',
    'паста чили', 'имбирь', 'эдамаме'
  ],
  '🍎 Фрукты и ягоды': [
    'яблоки', 'бананы', 'манго', 'лайм', 'ягоды', 'мята'
  ],
  '🥜 Орехи и другое': [
    'арахис', 'орехи грецкие', 'мед', 'сахар', 'томатная паста', 'уксус',
    'печенье овсяное', 'зеленый чай', 'крахмал', 'арахисовая паста'
  ],
  '🌶️ Специи и масла': [
    'соль', 'перец', 'лавровый лист', 'масло растительное', 'зелень', 'лимонный сок'
  ]
};

// Parse ingredient string - extract name and quantity
function parseIngredient(str) {
  const cleaned = str.trim();
  
  // Try to split by dash
  const parts = cleaned.split(/\s*[-–—]\s*/);
  
  if (parts.length >= 2) {
    const name = parts[0].trim();
    let qty = parts.slice(1).join(' - ').trim();
    
    // Normalize quantity units
    qty = qty
      .replace(/(\d+)\s*шт/gi, '$1 pcs')
      .replace(/(\d+)\s*г(?!\w)/gi, '$1g')
      .replace(/(\d+)\s*мл/gi, '$1ml')
      .replace(/(\d+)\s*ст\.л\./gi, '$1 tbsp')
      .replace(/(\d+)\s*ч\.л\./gi, '$1 tsp')
      .replace(/(\d+)\s*зубчик/gi, '$1 cloves')
      .replace(/по вкусу/gi, 'to taste')
      .replace(/щепотка/gi, 'pinch')
      .replace(/(\d+)\s*ломтик/gi, '$1 slices');
    
    return { name, qty };
  }
  
  // No quantity found
  return { name: cleaned, qty: '' };
}

// Normalize ingredient name for grouping
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/^[а-яё]\s+/, '') // Remove single letter prefixes
    .replace(/\s+/g, ' ')
    .trim();
}

// Categorize ingredient by name
function categorize(name) {
  const nameLower = normalizeName(name);
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(nameLower)) {
        return category;
      }
    }
  }
  
  return '📦 Другое';
}

// Collect all ingredients with better grouping
const ingredientMap = new Map();

for (const day of Object.values(recipes)) {
  for (const meal of ['breakfast', 'snack', 'dinner']) {
    if (day[meal]?.recipe?.ingredients) {
      for (const ing of day[meal].recipe.ingredients) {
        const parsed = parseIngredient(ing.name);
        const normalizedName = normalizeName(parsed.name);
        const category = categorize(parsed.name);
        
        // Create a key for grouping similar items
        const key = normalizedName;
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key);
          // Combine quantities
          if (existing.qty && parsed.qty) {
            if (!existing.qty.includes(parsed.qty)) {
              existing.qty = `${existing.qty} + ${parsed.qty}`;
            }
          } else if (!existing.qty && parsed.qty) {
            existing.qty = parsed.qty;
          }
        } else {
          ingredientMap.set(key, {
            name: parsed.name,
            qty: parsed.qty,
            category
          });
        }
      }
    }
  }
}

// Group by category
const grouped = {};
for (const ing of ingredientMap.values()) {
  if (!grouped[ing.category]) {
    grouped[ing.category] = [];
  }
  grouped[ing.category].push(ing);
}

// Sort ingredients within each category
for (const cat of Object.keys(grouped)) {
  grouped[cat].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

// Generate markdown
const weekNum = recipesPath.match(/W(\d+)/)?.[1] || '??';
const year = recipesPath.match(/(\d{4})-W/)?.[1] || '2026';

let markdown = `# 📝 Список покупок — Неделя ${weekNum}

> _Сгенерировано автоматически из плана питания_

---

`;

// Category order
const categoryOrder = [
  '🥬 Овощи', '🥩 Мясо и рыба', '🧀 Молочные продукты', 
  '🌾 Крупы и мучное', '🍜 Азиатские продукты', '🍎 Фрукты и ягоды',
  '🥜 Орехи и другое', '🌶️ Специи и масла', '📦 Другое'
];

for (const category of categoryOrder) {
  if (grouped[category] && grouped[category].length > 0) {
    markdown += `## ${category}\n\n`;
    
    for (const ing of grouped[category]) {
      const qty = ing.qty ? ` — ${ing.qty}` : '';
      markdown += `- [ ] **${ing.name}**${qty}\n`;
    }
    
    markdown += '\n---\n\n';
  }
}

// Stats
let totalItems = 0;
const stats = [];
for (const category of categoryOrder) {
  if (grouped[category]) {
    const count = grouped[category].length;
    totalItems += count;
    if (count > 0) {
      stats.push({ category: category.replace(/^[^\s]+\s/, ''), count });
    }
  }
}

markdown += `## 📊 Статистика\n\n`;
markdown += `| Категория | Количество |\n`;
markdown += `|-----------|-----------|\n`;
for (const stat of stats) {
  markdown += `| ${stat.category} | ${stat.count} |\n`;
}
markdown += `| **Всего** | **${totalItems} позиций** |\n\n`;
markdown += `_💡 Совет: Проверьте запасы дома перед покупкой! Многие специи и масла могут уже быть у вас._\n`;

// Write markdown
const outputDir = path.dirname(recipesPath);
fs.writeFileSync(path.join(outputDir, 'shopping-list.md'), markdown);
console.log('✅ Generated shopping-list.md');

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Список покупок — Неделя ${weekNum}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #333;
            text-align: center;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-style: italic;
        }
        .category {
            margin-bottom: 30px;
        }
        .category h2 {
            font-size: 1.5em;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
            color: #333;
        }
        .item {
            display: flex;
            align-items: center;
            padding: 12px 15px;
            margin-bottom: 8px;
            background: #f8f9fa;
            border-radius: 10px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .item:hover {
            background: #e9ecef;
            transform: translateX(5px);
        }
        .item.checked {
            opacity: 0.5;
            text-decoration: line-through;
        }
        .item input[type="checkbox"] {
            width: 22px;
            height: 22px;
            margin-right: 15px;
            cursor: pointer;
            accent-color: #667eea;
        }
        .item-name {
            font-weight: 600;
            color: #333;
            flex: 1;
        }
        .item-qty {
            color: #666;
            font-size: 0.9em;
            margin-left: 10px;
        }
        .stats {
            margin-top: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            color: white;
        }
        .stats h2 {
            margin-bottom: 15px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
        }
        .stat-item {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .tip {
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border-radius: 10px;
            color: #856404;
        }
        .print-btn {
            display: block;
            width: 100%;
            padding: 15px;
            margin-top: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.3s ease;
        }
        .print-btn:hover {
            transform: scale(1.02);
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; padding: 20px; }
            .print-btn { display: none; }
            .item:hover { transform: none; background: #f8f9fa; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 Список покупок</h1>
        <p class="subtitle">Неделя ${weekNum} • Сгенерировано автоматически</p>
        
        ${categoryOrder
          .filter(cat => grouped[cat] && grouped[cat].length > 0)
          .map(category => `
            <div class="category">
                <h2>${category}</h2>
                ${grouped[category].map(ing => `
                    <label class="item">
                        <input type="checkbox" onchange="this.parentElement.classList.toggle('checked')">
                        <span class="item-name">${ing.name}</span>
                        ${ing.qty ? `<span class="item-qty">${ing.qty}</span>` : ''}
                    </label>
                `).join('')}
            </div>
          `).join('')}
        
        <div class="stats">
            <h2>📊 Статистика</h2>
            <div class="stats-grid">
                ${stats.map(stat => `
                    <div class="stat-item">
                        <div class="stat-number">${stat.count}</div>
                        <div class="stat-label">${stat.category}</div>
                    </div>
                `).join('')}
                <div class="stat-item">
                    <div class="stat-number">${totalItems}</div>
                    <div class="stat-label">Всего</div>
                </div>
            </div>
        </div>
        
        <div class="tip">
            💡 <strong>Совет:</strong> Проверьте запасы дома перед покупкой! Многие специи и масла могут уже быть у вас.
        </div>
        
        <button class="print-btn" onclick="window.print()">🖨️ Распечатать список</button>
    </div>
    
    <script>
        // Save checked state to localStorage
        document.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
            const key = 'shopping-${weekNum}-' + i;
            cb.checked = localStorage.getItem(key) === 'true';
            if (cb.checked) cb.parentElement.classList.add('checked');
            cb.addEventListener('change', () => {
                localStorage.setItem(key, cb.checked);
            });
        });
    </script>
</body>
</html>`;

// Write HTML
const docsDir = path.join(path.dirname(outputDir), '..', '..', 'docs');
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'shopping-list.html'), html);
console.log('✅ Generated docs/shopping-list.html');

console.log(`\n📊 Total items: ${totalItems}`);
