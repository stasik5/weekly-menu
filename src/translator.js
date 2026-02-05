/**
 * Russian Translation Module
 * Translates English recipes to Russian
 * NOTE: Currently using placeholder translations
 * To enable real translations, configure a translation service (e.g., Google Translate API, DeepL, etc.)
 */

const fs = require('fs');
const path = require('path');

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
 * Translate text to Russian (placeholder implementation)
 * TODO: Integrate with a real translation service
 * Options:
 * - Google Cloud Translation API
 * - DeepL API
 * - LibreTranslate (self-hosted)
 * - Yandex Translation API
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

  // TODO: Replace with real translation service call
  // Example using Google Cloud Translation API:
  /*
  const { TranslationServiceClient } = require('@google-cloud/translate').v3;
  const client = new TranslationServiceClient();
  const projectId = 'your-project-id';
  const location = 'global';

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain',
    targetLanguageCode: targetLang,
  };

  const [response] = await client.translateText(request);
  const translatedText = response.translations[0].translatedText;

  translationCache[cacheKey] = translatedText;
  saveCache();
  return translatedText;
  */

  // Placeholder: Log what needs translation and return original
  console.log(`[TRANSLATION NEEDED] "${text}" → ${targetLang}`);

  // Return original text for now
  const result = text;
  translationCache[cacheKey] = result;
  saveCache();

  return result;
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
 * Translate all recipes in a weekly meal plan
 * @param {Object} weeklyPlan - Weekly plan with days → meals → recipe
 * @returns {Promise<Object>} Weekly plan with translated recipes
 */
async function translateWeeklyPlan(weeklyPlan) {
  if (!weeklyPlan) {
    return weeklyPlan;
  }

  console.log('\n🌐 Translating weekly plan to Russian...\n');

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

  console.log('\n✓ Translation complete\n');
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
  clearCache
};
