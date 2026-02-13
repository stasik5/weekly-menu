# Weekly Grocery Planner

Automated weekly meal planning system for 2 adults with mixed cuisine preferences (Slavic/pasta 60% + Asian 40%). Generates complete weekly menus with recipes, nutrition tracking, and grocery lists.

## Features

- 🍽️ **Weekly Menu Generation**: 7 days × 3 meals (breakfast, snack, dinner)
- 🌍 **Mixed Cuisine**: Alternates between Slavic/pasta (60%) and Asian (40%)
- 📊 **Nutrition Tracking**: Adjustable calorie levels (lower/medium/higher)
- 🛒 **Grocery List**: Automatically aggregates and categorizes ingredients
- 📄 **HTML Output**: Clean, readable web page with full menu and recipes
- ✅ **Validation**: Flags when nutrition exceeds 20% deviation from targets

## Project Structure

```
grocery-planner/
├── src/
│   ├── menu-generator.js       # Generates weekly meal plans
│   ├── recipe-researcher.js     # Finds and parses recipes
│   ├── grocery-list-builder.js  # Aggregates ingredients by category
│   ├── nutrition.js             # Calculates and validates nutrition
│   └── site-generator.js        # Generates HTML pages
├── output/
│   └── weekly/
│       └── [YYYY-WXX]/          # Generated weekly output
│           ├── index.html       # Weekly menu page
│           └── recipes.json     # Recipe data
├── index.js                     # Main entry point
├── test.js                      # Test suite
├── config.json                  # Configuration file
└── README.md
```

## Installation

No additional installation required - uses Node.js built-in modules.

## Usage

### Generate Weekly Menu

```bash
node index.js
```

This will:
1. Generate a 7-day meal plan
2. Attach recipes (fallback templates in Phase 1-2)
3. Build grocery list
4. Calculate nutrition
5. Generate HTML page
6. Save to `output/weekly/[YYYY-WXX]/`

### Run Tests

```bash
node test.js
```

Tests:
- Menu generation for all nutrition levels
- Cuisine distribution (60/40 split)
- Meal variety (no repeats)
- Nutrition validation (20% tolerance)

### Configuration

Edit `config.json` to customize:

```json
{
  "nutrition": "medium",           // lower, medium, or higher
  "cuisine": {
    "slavicRatio": 0.6,
    "asianRatio": 0.4
  },
  "people": [
    { "name": "Stanislav", "age": 31, "weight": 85, "gender": "male", "preference": "slavic" },
    { "name": "Wife", "age": 26, "weight": 63, "gender": "female", "preference": "asian" }
  ],
  "output": {
    "baseDir": "./output",
    "weeklyDir": "./output/weekly",
    "archiveDir": "./output/archive"
  }
}
```

## Nutrition Targets

| Level | Daily Calories | Protein | Carbs | Fat |
|-------|---------------|---------|-------|-----|
| Lower | 3200-3600 | 140-160g | 300-350g | 90-110g |
| Medium | 3800-4200 | 160-180g | 400-450g | 120-140g |
| Higher | 4400-5000 | 180-200g | 500-550g | 150-170g |

*Note: Values are for 2 adults combined.*

## Meal Calorie Breakdown (Medium Level, 2 Adults)

- **Breakfast**: ~1300 kcal
- **Snack**: ~500 kcal
- **Dinner**: ~1900 kcal
- **Daily Total**: ~3700 kcal

## Cuisine Options

### Slavic/Pasta (60%)
- Breakfast: Buckwheat porridge, oatmeal, syrniki, blini, scrambled eggs
- Snacks: Cheese with apples, yogurt, cottage cheese, pickled vegetables
- Dinners: Borscht, chicken soup, beef stroganoff, pelmeni, cabbage rolls

### Asian (40%)
- Breakfast: Congee, fried rice, steamed buns, rice porridge
- Snacks: Edamame, seaweed snacks, mango, pickled ginger
- Dinners: Chicken teriyaki, pad thai, pho, bibimbap, green curry

## Output Format

### HTML Page

The generated HTML includes:
- Nutrition summary with daily/weekly totals
- Meal grid showing all 21 meals with calorie estimates
- Grocery list organized by category (produce, meat, dairy, pantry, other)
- Clean, responsive design with mobile support

### JSON Data

The `recipes.json` contains:
- Complete meal plan for all 7 days
- Recipe details for each meal
- Nutrition information
- Cuisine classifications

## Implementation Status

### ✅ Phase 1: Core Functionality
- [x] Menu generator with variety
- [x] Basic recipe templates (fallback)
- [x] Grocery list aggregation
- [x] HTML site generation
- [x] Nutrition calculation
- [x] Nutrition validation

### ✅ Phase 2: Recipe Research
- [x] Recipe data structure with parsing functions
- [x] Fallback recipe system
- [x] Ingredient extraction and categorization
- [x] Nutrition estimation framework
- [x] web_search query builder

### ✅ Phase 3: Automation (COMPLETE)
- [x] **web_search integration for recipes** - Uses OpenClaw's web_search tool
- [x] **Real ingredient parsing** - Extracts ingredients from recipe websites
- [x] **GitHub auto-publish** - Automatic commit and push to GitHub
- [x] **Virtual pantry tracking** - Weekly ingredient tracking display
- [x] **Cron job automation** - Runs every Sunday at 3AM/4AM UTC

### 📅 Automated Schedule

The system runs automatically on Sundays:

- **3:00 AM UTC**: Menu Generator
  - Generates full weekly menu
  - Researches recipes using web_search
  - Creates virtual pantry
  - Publishes to GitHub

- **4:00 AM UTC**: Menu Reviewer
  - Validates generated menu
  - Checks quality and completeness
  - Self-heals if issues found
  - Sends Telegram notification

No manual intervention needed!

## Known Limitations

1. **Fallback Recipes**: Currently using template recipes instead of real recipe data. Ingredients are generic placeholders.

2. **Nutrition Estimates**: Calorie and macro values are estimated based on meal type ratios, not actual recipe analysis.

3. **Grocery List**: Limited to generic items until real recipe data is integrated.

4. **No Recipe URLs**: Fallback templates don't include source URLs.

## Testing

Run the test suite to verify:
```bash
node test.js
```

Expected results:
- ✅ Menu generation for all nutrition levels
- ✅ Cuisine distribution near 60/40 split
- ✅ No duplicate meals per meal type
- ✅ Nutrition values within 20% tolerance

## Future Enhancements

1. **Recipe Research Integration**: Use OpenClaw's web_search tool to find actual recipes
2. **Detailed Ingredient Parsing**: Extract real quantities and combine duplicates properly
3. **Recipe Fetching**: Use web_fetch to get full recipe details from URLs
4. **GitHub Auto-Publish**: Commit and push to GitHub repository
5. **3-Week History**: Maintain archive of previous weeks with navigation
6. **User Preferences**: Allow customization of meal preferences and restrictions
7. **Recipe Rating**: Track and prefer higher-rated recipes over time

## License

Personal project for Stanislav and family meal planning.
