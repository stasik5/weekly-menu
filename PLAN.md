# Weekly Grocery Planner - Implementation Plan

## Project Overview

Automated weekly meal planning system for 2 adults (31M 85kg, 26F 63kg) with:
- Weekly menu: breakfast, snack, dinner
- Mixed cuisine: Slavic/pasta (him) + Asian (her)
- Adjustable nutrition: lower/medium/higher calories (weekly setting)
- Full recipes with nutritional info
- Consolidated grocery list
- GitHub Pages hosting with 3-week history

## Architecture

### Components

1. **Menu Generator** (`menu-generator.js`)
   - Creates balanced weekly meal plan
   - Alternates cuisine preferences (Slavic/pasta vs Asian)
   - Respects nutrition level setting
   - Ensures variety across the week

2. **Recipe Researcher** (`recipe-researcher.js`)
   - Searches web for recipes matching meal plan
   - Extracts: title, ingredients, instructions, nutrition info
   - Uses web_search to find multiple recipe sources
   - Falls back to template recipes if search fails

3. **Grocery List Builder** (`grocery-list-builder.js`)
   - Aggregates ingredients from all recipes
   - Combines duplicate ingredients
   - Categorizes by type (produce, meat, dairy, etc.)
   - Adds quantities intelligently

4. **Nutritional Calculator** (`nutrition.js`)
   - Calculates calories per meal/day
   - Estimates macros (protein, carbs, fats)
   - Compares against targets based on nutrition level

5. **GitHub Pages Generator** (`site-generator.js`)
   - Generates HTML pages for weekly menu
   - Embeds full recipes with nutrition
   - Includes grocery list
   - Maintains 3-week history with navigation

6. **Publisher** (`publisher.js`)
   - Commits generated files to git
   - Pushes to GitHub
   - Handles versioning

7. **Configuration** (`config.json`)
   - Nutrition level setting (lower/medium/higher)
   - Cuisine preferences
   - GitHub repo details

8. **Grocery Cart Filler** (`cart-filler.js`) - **NEW**
   - Logs into Barbora.lt (Lithuanian grocery store)
   - Searches for grocery list items
   - Adds items to cart
   - Reports success/failure for each item

### File Structure

```
grocery-planner/
├── src/
│   ├── menu-generator.js
│   ├── recipe-researcher.js
│   ├── grocery-list-builder.js
│   ├── nutrition.js
│   ├── site-generator.js
│   └── publisher.js
├── output/
│   ├── weekly/
│   │   └── 2026-W05/          # Current week
│   │       ├── index.html
│   │       └── recipes.json
│   ├── archive/
│   │   └── 2026-W04/          # Previous week
│   └── ├── 2026-W03/          # Week before
└── config.json
```

## Nutrition Targets

| Level | Daily Calories | Protein | Carbs | Fat |
|-------|---------------|---------|-------|-----|
| Lower | 3200-3600 | 140-160g | 300-350g | 90-110g |
| Medium | 3800-4200 | 160-180g | 400-450g | 120-140g |
| Higher | 4400-5000 | 180-200g | 500-550g | 150-170g |

*Note: Calories split between 2 adults. Meals: 400-600 kcal breakfast, 150-250 kcal snack, 600-800 kcal dinner*

## Technology Stack

- **Node.js** - Runtime (already installed)
- **web_search tool** - Recipe research
- **git CLI** - Version control
- **GitHub** - Hosting (gh CLI available)
- **GitHub Pages** - Static site hosting

## Cron Jobs

### Job 1: Menu Research & Generation
- **Schedule:** Every Sunday at 3:00 AM UTC
- **Actions:**
  1. Generate weekly menu
  2. Research recipes for each meal
  3. Calculate nutrition
  4. Generate grocery list
  5. Build GitHub Pages site
  6. **NEW:** Fill Barbora.lt shopping cart
  7. Commit to GitHub (draft commit)

### Job 2: Critique & Publish
- **Schedule:** Every Sunday at 4:00 AM UTC
- **Actions:**
  1. Review generated menu
  2. Check nutrition balance
  3. Validate variety
  4. Make adjustments if needed
  5. Final commit and push to GitHub
  6. Send notification with link to site + cart status

## Implementation Phases

### Phase 1: Core Functionality
- Menu generator with basic variety
- Simple recipe placeholder (no web search)
- Basic grocery list aggregation
- HTML site generation
- Manual GitHub push

### Phase 2: Recipe Research
- Integrate web_search for recipe finding
- Recipe extraction and parsing
- Better grocery list categorization

### Phase 3: Automation
- GitHub API integration for auto-publish
- Cron job setup
- 3-week history management
- Nutrition validation

## GitHub Repo Structure

```
stasik5/weekly-menu/
├── index.html                 # Current week (redirect)
├── archive/
│   ├── week-1.html
│   └── week-2.html
└── README.md
```

## Agent Workflow

1. **Agent 1 (Implementation):** Build the core system
   - Create file structure
   - Implement menu generator
   - Implement recipe researcher
   - Implement grocery list builder
   - Implement site generator
   - Test basic functionality

2. **Agent 2 (Review):** Code review and architecture validation
   - Review code quality
   - Check for edge cases
   - Validate nutrition calculations
   - Suggest improvements

3. **Agent 3 (Debug & Refine):** Fix issues and polish
   - Fix bugs from review
   - Add error handling
   - Improve robustness
   - Final testing

## Configuration Example

```json
{
  "nutrition": "medium",
  "cuisine": {
    "preference1": "slavic",
    "preference2": "asian",
    "ratio": 0.6
  },
  "github": {
    "repo": "stasik5/weekly-menu",
    "branch": "main"
  },
  "people": [
    {"name": "Stanislav", "age": 31, "weight": 85, "gender": "male"},
    {"name": "Wife", "age": 26, "weight": 63, "gender": "female"}
  ]
}
```
