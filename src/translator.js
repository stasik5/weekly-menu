/**
 * Russian Translation Module
 * Translates English recipes to Russian using OpenClaw agent-based translation
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Translation cache file path
const CACHE_PATH = path.join(__dirname, '../output/translation-cache.json');

// Load translation cache if it exists
let translationCache = {};

if (fs.existsSync(CACHE_PATH)) {
  try {
    const cacheContent = fs.readFileSync(CACHE_PATH, 'utf8');
    translationCache = JSON.parse(cacheContent);
  } catch (error) {
    console.warn('Warning: Could not load translation cache:', error.message);
  }
}

// Save translation cache to disk
function saveCache() {
  const cacheDir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  fs.writeFileSync(CACHE_PATH, JSON.stringify(translationCache, null, 2), 'utf8');
}

/**
 * Check if we're in OpenClaw environment with sessions_spawn available
 * @returns {boolean}
 */
function hasSessionsSpawn() {
  return typeof sessions_spawn === 'function' || global.sessions_spawn !== undefined;
}

/**
 * Get the sessions_spawn function from global or require it
 * @returns {Function|null}
 */
function getSessionsSpawn() {
  if (typeof sessions_spawn === 'function') {
    return sessions_spawn;
  }
  if (global.sessions_spawn && typeof global.sessions_spawn === 'function') {
    return global.sessions_spawn;
  }
  return null;
}

/**
 * Translate text to Russian using OpenClaw agent
 * Falls back to cache if available, returns original if no agent available
 *
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (default: 'ru' for Russian)
 * @returns {Promise<string>} Translated text
 */
async function translateText(text, targetLang = 'ru') {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Check cache first
  const cacheKey = `${text}:${targetLang}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  // Check if sessions_spawn is available
  const sessionsSpawn = getSessionsSpawn();
  if (!sessionsSpawn) {
    console.log(`⚠️ No sessions_spawn available, returning original text: "${text.substring(0, 50)}..."`);
    const result = text;
    translationCache[cacheKey] = result;
    saveCache();
    return result;
  }

  try {
    // Spawn agent for translation
    const result = await sessionsSpawn({
      task: `Translate this text to ${targetLang}. Return ONLY the translated text, no explanations or formatting:\n\n${text}`,
      label: 'translate',
      timeoutSeconds: 30,
      cleanup: 'delete'
    });

    // Extract the translated text from the agent response
    // The response structure depends on how sessions_spawn returns data
    const translatedText = typeof result === 'string' ? result.trim() :
                          result?.response?.trim() ||
                          result?.output?.trim() ||
                          result?.text?.trim() ||
                          text; // fallback to original

    translationCache[cacheKey] = translatedText;
    saveCache();

    return translatedText;

  } catch (error) {
    console.warn(`⚠️ Translation failed for "${text.substring(0, 50)}...": ${error.message}`);
    // Return original text on error
    const result = text;
    translationCache[cacheKey] = result;
    saveCache();
    return result;
  }
}

/**
 * Translate a single ingredient object to Russian
 * @param {Object} ingredient - Ingredient with name and optional instructions
 * @returns {Promise<Object>} Translated ingredient
 */
async function translateIngredient(ingredient) {
  if (!ingredient) {
    return ingredient;
  }

  const translated = {
    ...ingredient,
    name: await translateText(ingredient.name || '', 'ru')
  };

  // Translate ingredient instructions if present
  if (ingredient.instructions) {
    translated.instructions = await translateText(ingredient.instructions, 'ru');
  }

  return translated;
}

/**
 * Translate an entire recipe to Russian
 * @param {Object} recipe - Recipe object with name, ingredients, instructions, etc.
 * @returns {Promise<Object>} Translated recipe
 */
async function translateRecipe(recipe) {
  if (!recipe) {
    return recipe;
  }

  console.log(`Translating recipe: ${recipe.title || recipe.name}`);

  const translated = {
    ...recipe,
    // Translate title/name
    title: recipe.title ? await translateText(recipe.title, 'ru') : recipe.title,
    name: recipe.name ? await translateText(recipe.name, 'ru') : recipe.name,

    // Translate all ingredients
    ingredients: await Promise.all(
      (recipe.ingredients || []).map(ing => translateIngredient(ing))
    ),

    // Translate instructions (could be string or array)
    instructions: Array.isArray(recipe.instructions)
      ? await Promise.all(
          (recipe.instructions || []).map(inst => translateText(inst, 'ru'))
        )
      : await translateText(recipe.instructions || '', 'ru')
  };

  // Keep English source URL for reference
  if (recipe.url) {
    translated.sourceUrl = recipe.url;
    translated.url = recipe.url; // Keep original URL
  }

  return translated;
}

/**
 * Translate all recipes in a weekly meal plan using BATCH translation
 * Spawns a single agent to translate everything at once for efficiency
 *
 * @param {Object} weeklyPlan - Weekly plan with days → meals → recipe
 * @returns {Promise<Object>} Weekly plan with translated recipes
 */
async function translateWeeklyPlan(weeklyPlan) {
  if (!weeklyPlan) {
    return weeklyPlan;
  }

  console.log('\n🌐 Translating weekly plan to Russian (batch mode)...\n');

  // Check if sessions_spawn is available
  const sessionsSpawn = getSessionsSpawn();
  if (!sessionsSpawn) {
    console.log('⚠️ No sessions_spawn available, using individual translation fallback...\n');
    return translateWeeklyPlanFallback(weeklyPlan);
  }

  try {
    // Prepare the plan for the agent - create a clean JSON structure
    const planForAgent = {};
    for (const [day, meals] of Object.entries(weeklyPlan)) {
      planForAgent[day] = {};
      for (const [mealType, mealData] of Object.entries(meals)) {
        planForAgent[day][mealType] = {
          name: mealData.name || '',
          targetCalories: mealData.targetCalories,
          recipe: mealData.recipe ? {
            name: mealData.recipe.name || mealData.recipe.title || '',
            title: mealData.recipe.title || mealData.recipe.name || '',
            ingredients: (mealData.recipe.ingredients || []).map(ing => ({
              name: ing.name || '',
              amount: ing.amount,
              unit: ing.unit,
              instructions: ing.instructions || ''
            })),
            instructions: Array.isArray(mealData.recipe.instructions)
              ? mealData.recipe.instructions
              : mealData.recipe.instructions || ''
          } : null
        };
      }
    }

    // Create the agent task
    const agentTask = `Translate the following meal plan to Russian. Return ONLY valid JSON with the exact same structure.

Translate ALL text to Russian:
- Meal names
- Recipe names and titles
- All ingredient names
- All instructions

Keep numeric values, units, and structure exactly the same. Do NOT translate the day names (Monday, Tuesday, etc.) - keep them in English.

Return ONLY the translated JSON. No explanations, no markdown formatting, just the raw JSON:

${JSON.stringify(planForAgent, null, 2)}`;

    console.log('🤖 Spawning translation agent...\n');

    // Spawn the agent
    const result = await sessionsSpawn({
      task: agentTask,
      label: 'translate-weekly-plan',
      timeoutSeconds: 180, // 3 minutes for full plan
      cleanup: 'delete'
    });

    // Parse the agent response
    let translatedData;
    const responseText = typeof result === 'string' ? result :
                        result?.response ||
                        result?.output ||
                        result?.text ||
                        JSON.stringify(result);

    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      translatedData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No valid JSON found in agent response');
    }

    // Apply translations back to the original weekly plan structure
    const translatedPlan = {};
    for (const [day, meals] of Object.entries(weeklyPlan)) {
      translatedPlan[day] = {};
      for (const [mealType, mealData] of Object.entries(meals)) {
        const translatedMeal = translatedData[day]?.[mealType];

        translatedPlan[day][mealType] = {
          ...mealData,
          name: translatedMeal?.name || mealData.name,
          targetCalories: mealData.targetCalories
        };

        // Apply recipe translations if exists
        if (mealData.recipe && translatedMeal?.recipe) {
          const originalRecipe = mealData.recipe;
          const translatedRecipeData = translatedMeal.recipe;

          translatedPlan[day][mealType].recipe = {
            ...originalRecipe,
            name: translatedRecipeData.name || translatedRecipeData.title || originalRecipe.name,
            title: translatedRecipeData.title || translatedRecipeData.name || originalRecipe.title,
            ingredients: (originalRecipe.ingredients || []).map((ing, idx) => ({
              ...ing,
              name: translatedRecipeData.ingredients?.[idx]?.name || ing.name,
              instructions: translatedRecipeData.ingredients?.[idx]?.instructions || ing.instructions
            })),
            instructions: Array.isArray(originalRecipe.instructions)
              ? (translatedRecipeData.instructions || originalRecipe.instructions)
              : (translatedRecipeData.instructions || originalRecipe.instructions)
          };
        }
      }

      console.log(`  ✓ Translated ${day}`);
    }

    console.log('\n✓ Batch translation complete\n');
    return translatedPlan;

  } catch (error) {
    console.warn(`⚠️ Batch translation failed: ${error.message}`);
    console.log('🔄 Falling back to individual translation...\n');

    // Fallback to individual translation
    return translateWeeklyPlanFallback(weeklyPlan);
  }
}

/**
 * Fallback translation method - translates each item individually
 * Used when batch translation fails or sessions_spawn is not available
 *
 * @param {Object} weeklyPlan - Weekly plan with days → meals → recipe
 * @returns {Promise<Object>} Weekly plan with translated recipes
 */
async function translateWeeklyPlanFallback(weeklyPlan) {
  if (!weeklyPlan) {
    return weeklyPlan;
  }

  console.log('🔄 Using individual translation (fallback mode)...\n');

  const translatedPlan = {};

  for (const [day, meals] of Object.entries(weeklyPlan)) {
    translatedPlan[day] = {};

    for (const [mealType, mealData] of Object.entries(meals)) {
      translatedPlan[day][mealType] = {
        ...mealData,
        name: await translateText(mealData.name || '', 'ru'),
        // Translate the recipe if present
        recipe: mealData.recipe ? await translateRecipe(mealData.recipe) : null
      };
    }

    console.log(`  ✓ Translated ${day}`);
  }

  console.log('\n✓ Translation complete (fallback mode)\n');
  return translatedPlan;
}

/**
 * Clear the translation cache
 */
function clearCache() {
  translationCache = {};
  if (fs.existsSync(CACHE_PATH)) {
    fs.unlinkSync(CACHE_PATH);
  }
  console.log('Translation cache cleared');
}

module.exports = {
  translateText,
  translateIngredient,
  translateRecipe,
  translateWeeklyPlan,
  translateWeeklyPlanFallback,
  clearCache,
  hasSessionsSpawn,
  getSessionsSpawn
};
