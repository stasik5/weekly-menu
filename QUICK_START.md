# Quick Start Guide - Weekly Grocery Planner with Web Search

## Overview
The Weekly Grocery Planner now supports real recipe research using web_search when running from an OpenClaw agent.

## Three Ways to Run

### 1. Standalone Node.js (Fallback Recipes)
Run directly from terminal - uses fallback template recipes:
```bash
cd /home/stasik5/.openclaw/workspace/grocery-planner
node index.js
```

**Result:** All meals use fallback template recipes (no web search).

---

### 2. OpenClaw Agent with web_search (Real Recipes)
Run from OpenClaw agent with web_search configured:
```bash
openclaw exec "cd /home/stasik5/.openclaw/workspace/grocery-planner && node agent-main.js"
```

**Prerequisites:**
- Configure Brave API key: `openclaw configure --section web`
- Run as an OpenClaw agent (not direct Node.js)

**Result:** Real recipes found via web_search for each meal.

---

### 3. OpenClaw Agent via index.js (Real Recipes)
Run the main script from OpenClaw agent:
```bash
openclaw exec "cd /home/stasik5/.openclaw/workspace/grocery-planner && node index.js"
```

**Result:** Same as #2, web_search will be used if available.

---

## Testing

### Test with Mock Data
```bash
cd /home/stasik5/.openclaw/workspace/grocery-planner
node test-websearch-integration.js
```

This simulates web_search with predefined results to verify the integration works.

---

## Configuration Files

### `config.json`
Main configuration file:
- `nutrition`: 'lower', 'medium', or 'higher' (daily calories)
- `cuisine`: Ratios for slavic (0.6) and asian (0.4) meals
- `people`: Profiles for people in the household
- `github`: Repository info for publishing

### Output Files
- `output/menu.json` - Generated meal plan
- `output/recipes-data.json` - Researched recipes (with web_search)
- `output/weekly/YYYY-WXX/index.html` - Generated website
- `output/weekly/YYYY-WXX/recipes.json` - Recipes for the week

---

## Architecture

### Main Scripts

| File | Purpose | Uses web_search? |
|------|---------|------------------|
| `index.js` | Main entry point | Detects & uses if available |
| `agent-main.js` | OpenClaw wrapper | Yes, checks availability |
| `agent-research-recipes.js` | Recipe research agent | Yes, requires web_search |

### Source Modules

| File | Purpose | Uses web_search? |
|------|---------|------------------|
| `src/recipe-fetcher.js` | Load/attach recipes | No |
| `src/recipe-researcher.js` | Parse recipe data | No (helper functions) |
| `src/menu-generator.js` | Generate meal plan | No |
| `src/grocery-list-builder.js` | Build grocery list | No |
| `src/nutrition.js` | Calculate nutrition | No |
| `src/site-generator.js` | Generate HTML | No |
| `src/publisher.js` | Publish to GitHub | No |

---

## Data Flow

### With web_search Available:
```
1. Generate menu (menu-generator.js)
   ↓
2. Save menu to output/menu.json
   ↓
3. Research recipes (agent-research-recipes.js)
   - Uses web_search for each meal
   - Parses results
   - Saves to output/recipes-data.json
   ↓
4. Load recipes (recipe-fetcher.js)
   - Reads output/recipes-data.json
   - Attaches to meals
   ↓
5. Build grocery list (grocery-list-builder.js)
   ↓
6. Calculate nutrition (nutrition.js)
   ↓
7. Generate HTML (site-generator.js)
   ↓
8. Publish to GitHub (publisher.js)
```

### Without web_search:
```
1. Generate menu
   ↓
2. Try research recipes (fails gracefully)
   ↓
3. Use fallback recipes
   ↓
4-8. Continue as above
```

---

## Troubleshooting

### "web_search not available"
This is normal when running from Node.js directly. To enable web_search:
1. Configure Brave API key: `openclaw configure --section web`
2. Run via OpenClaw agent: `openclaw exec "node agent-main.js"`

### No recipes found
Check:
- Is web_search available? (Look for "web_search not available" in output)
- Is Brave API key configured? (`openclaw configure --section web`)
- Is internet connection working?

### GitHub publish fails
Check:
- Git credentials are set up
- Repository exists and is accessible
- No uncommitted changes in local repo

---

## Features

### Recipe Research
- Searches for recipes using web_search
- Parses title, ingredients, instructions, nutrition
- Falls back to template if search fails
- Handles multiple search results

### Grocery List
- Extracts ingredients from recipes
- Categorizes by type (produce, meat, dairy, etc.)
- Merges duplicates across meals

### Nutrition Tracking
- Calculates daily nutrition totals
- Compares to targets
- Shows protein, carbs, fat breakdown

### Website Generation
- Dark mode support
- Responsive design
- Recipes with ingredients and instructions
- Grocery list by category
- Nutrition summary

### GitHub Publishing
- Automatic commits
- Pushes to configured repo
- Generates GitHub Pages site

---

## Advanced Usage

### Custom Meal Templates
Edit `src/menu-generator.js` to add/remove meals:
```javascript
const MEAL_TEMPLATES = {
  slavic: {
    breakfast: [
      'Your custom meal',
      // ...
    ]
  }
};
```

### Adjust Calorie Targets
Edit `src/menu-generator.js`:
```javascript
const CALORIE_TARGETS = {
  lower: { breakfast: 1200, snack: 400, dinner: 1800 },
  medium: { breakfast: 1400, snack: 500, dinner: 2100 },
  higher: { breakfast: 1650, snack: 600, dinner: 2450 }
};
```

### Customize Nutrition Ratios
Edit `src/recipe-researcher.js`:
```javascript
const ratios = {
  breakfast: { protein: 0.15, carbs: 0.30, fat: 0.55 },
  dinner: { protein: 0.25, carbs: 0.41, fat: 0.34 }
};
```

---

## Getting Help

For issues or questions:
1. Check `WEBSEARCH_INTEGRATION_FIX.md` for architecture details
2. Run `node test-websearch-integration.js` to verify integration
3. Review logs in terminal output
4. Check generated files in `output/` directory

---

## Summary

The Weekly Grocery Planner now supports two modes:
- **Standalone Node.js**: Works offline with fallback recipes
- **OpenClaw Agent**: Uses web_search to find real recipes

Both modes generate a complete weekly menu, grocery list, and website with GitHub publishing.
