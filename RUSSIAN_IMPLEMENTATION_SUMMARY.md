# Russian Translation Simplification - Implementation Summary

## Approach Chosen: Option B (Remove translator.js entirely)

### What Was Changed

#### 1. `src/recipe-researcher.js`
- Added `RUSSIAN_SEARCH_QUERIES` mapping with Russian search queries for all meal names
- Modified `buildSearchQuery()` to use Russian queries instead of English
- Example mappings:
  - "Borscht with sour cream" → "борщ со сметаной рецепт"
  - "Pad Thai with shrimp" → "пад тай с креветками рецепт"
  - "Syrniki" → "сырники рецепт"

#### 2. `index.js`
- Removed `translator` import
- Removed Step 3 (Translation) from the pipeline
- Updated pipeline description: `menu → recipes (Russian) → chef review → normalize → grocery list → pantry → HTML → publish`
- Updated step numbers in console logs (3→4, 4→5, etc.)

#### 3. `src/grocery-list-builder.js` (Bug Fix)
- Fixed `extractIngredientName()` to handle both string and object ingredients
- Fixed `extractQuantity()` to handle both string and object ingredients
- Fixed `categorizeIngredient()` to handle both string and object ingredients
- This was necessary because pantry normalizer converts ingredients to objects

### Pipeline Flow (New)

```
1. Generate menu plan
2. Research recipes (searches in RUSSIAN from start)
3. Chef review
4. Normalize ingredients
5. Build grocery list
6. Generate virtual pantry
7. Generate HTML
8. Save files
9. Publish to GitHub
```

### Benefits of This Approach

1. **Simpler**: No translation step needed
2. **More Efficient**: Recipes are in Russian from the start
3. **Faster**: No agent spawn for translation
4. **Cleaner**: One less module in the pipeline
5. **Better Quality**: Russian recipes are more likely to be culturally appropriate

### Files Modified

- `src/recipe-researcher.js` - Added Russian search query mapping
- `index.js` - Removed translator import and translation step
- `src/grocery-list-builder.js` - Fixed ingredient handling bug

### Files No Longer Used

- `src/translator.js` - Can be deleted if desired (not imported anywhere)

### Testing Notes

The implementation was tested with `node index.js`. Since the script was run outside the OpenClaw environment (no web_search available), all recipes fell back to templates. However:

- The pipeline completed successfully
- No translation errors occurred
- The HTML output is in Russian
- When web_search IS available in OpenClaw, recipes will be searched in Russian

### Verification

Output HTML is in Russian:
- `<html lang="ru">`
- Title: "Еженедельное меню - 2026-W06"
- All UI elements use Russian text from site-generator.js

### Future Enhancements (Optional)

1. Delete `src/translator.js` if no longer needed
2. Add more Russian meal names to the mapping as needed
3. Consider adding cuisine-specific Russian queries (e.g., traditional Russian names for Slavic dishes)
