# Agent-Based Translation - Implementation Summary

## What Was Implemented

Updated `src/translator.js` to use OpenClaw's `sessions_spawn` for agent-based translation instead of external APIs.

## Key Features

### 1. Batch Translation Mode
- Spawns **ONE agent** to translate the entire weekly plan at once (not 21 separate calls)
- Sends all meal names, recipe names, ingredients, and instructions in a single JSON payload
- Agent returns structured JSON with all translations applied
- Much more efficient than per-recipe translation

### 2. Fallback Mechanism
The implementation has three levels of fallback:

**Level 1: Batch Translation** (preferred)
- Uses `sessions_spawn` with a single agent call
- Translates entire weekly plan in one request
- 3-minute timeout for the translation agent

**Level 2: Individual Translation**
- Activates if batch translation fails
- Translates each recipe separately using `sessions_spawn`
- Slower but more granular error handling

**Level 3: Offline Mode**
- Activates if `sessions_spawn` is not available (e.g., running with `node` directly)
- Returns original text without translation
- Useful for development/testing

### 3. Translation Cache
- Caches translations in `output/translation-cache.json`
- Reduces API calls for repeated translations
- Can be cleared with `translator.clearCache()`

## How It Works

### In OpenClaw Environment (with sessions_spawn)

```javascript
// The agent task sent to the subagent
const agentTask = `Translate the following meal plan to Russian. Return ONLY valid JSON with the exact same structure.

Translate ALL text to Russian:
- Meal names
- Recipe names and titles
- All ingredient names
- All instructions

Keep numeric values, units, and structure exactly the same. Do NOT translate the day names (Monday, Tuesday, etc.) - keep them in English.

Return ONLY the translated JSON. No explanations, no markdown formatting, just the raw JSON:

${JSON.stringify(planForAgent, null, 2)}`;

// Spawn the translation agent
const result = await sessionsSpawn({
  task: agentTask,
  label: 'translate-weekly-plan',
  timeoutSeconds: 180, // 3 minutes
  cleanup: 'delete'
});

// Parse and apply the result
const translatedData = JSON.parse(extractJSON(result));
// Apply translations back to weeklyPlan...
```

### Outside OpenClaw Environment

When running directly with `node`, `sessions_spawn` is not available, so the module:
1. Logs a warning: `⚠️ No sessions_spawn available`
2. Returns original text (no translation)
3. Allows pipeline to continue for development/testing

## Testing

### Test Script

Run the test script to verify the implementation:

```bash
cd /home/stasik5/.openclaw/workspace/grocery-planner
node test-translation.js
```

### Full Pipeline

```bash
cd /home/stasik5/.openclaw/workspace/grocery-planner
node index.js
```

### In OpenClaw Environment

To test with actual agent-based translation, run through OpenClaw:

```bash
openclaw agent --message "Run grocery planner with translations" --deliver
```

## Code Structure

### Main Functions

1. **`translateWeeklyPlan(weeklyPlan)`** - Main entry point
   - Tries batch translation first
   - Falls back to individual translation on error
   - Returns translated weekly plan

2. **`translateText(text, targetLang)`** - Individual text translation
   - Checks cache first
   - Uses `sessions_spawn` if available
   - Handles errors gracefully

3. **`translateRecipe(recipe)`** - Translate a single recipe
   - Translates name/title
   - Translates all ingredients
   - Translates instructions (string or array)

4. **`translateIngredient(ingredient)`** - Translate ingredient
   - Translates ingredient name
   - Translates instructions if present

5. **`translateWeeklyPlanFallback(weeklyPlan)`** - Fallback mode
   - Translates each meal individually
   - Used when batch translation fails

### Helper Functions

- **`hasSessionsSpawn()`** - Check if `sessions_spawn` is available
- **`getSessionsSpawn()`** - Get the `sessions_spawn` function
- **`saveCache()`** - Save translation cache to disk
- **`clearCache()`** - Clear translation cache

## Translation Quality

The translation quality depends on the model used by the spawned agent. With a capable model:
- Meal names should be translated naturally
- Ingredient names should be accurate
- Instructions should be grammatically correct
- Numeric values and units are preserved

## Benefits of Agent-Based Translation

1. **No External API Keys Needed** - Uses OpenClaw's built-in agent system
2. **Context-Aware** - Agent can see the entire meal plan for consistency
3. **Flexible** - Easy to modify prompts for different languages or styles
4. **Efficient** - Batch mode reduces agent calls
5. **Graceful Degradation** - Works in offline mode for development

## Future Enhancements

Possible improvements:
- Add language parameter (currently hardcoded to Russian)
- Support for different translation styles (formal, casual, etc.)
- Translation verification/quality check
- Support for translating cuisine-specific terms
- Add translation notes for cultural adaptations

## Notes

- Day names (Monday, Tuesday, etc.) are kept in English
- Numeric values and units are preserved exactly
- Original recipe URLs are kept for reference
- Translation cache speeds up repeated translations
- The module is production-ready and integrates seamlessly into the pipeline
