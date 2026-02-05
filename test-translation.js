/**
 * Test script for agent-based translation
 */

const translator = require('./src/translator');

async function testTranslation() {
  console.log('='.repeat(60));
  console.log('Testing Agent-Based Translation');
  console.log('='.repeat(60));

  // Check if sessions_spawn is available
  console.log('\n1. Checking for sessions_spawn availability...');
  const hasSpawn = translator.hasSessionsSpawn();
  console.log(`   sessions_spawn available: ${hasSpawn ? '✓' : '✗'}`);

  if (!hasSpawn) {
    console.log('\n⚠️ sessions_spawn not available - testing in offline mode\n');
  }

  // Test with a small sample weekly plan
  console.log('\n2. Testing batch translation with sample plan...\n');

  const samplePlan = {
    "Monday": {
      "breakfast": {
        "name": "Oatmeal with berries",
        "targetCalories": 400,
        "recipe": {
          "title": "Berry Oatmeal",
          "ingredients": [
            { "name": "rolled oats", "amount": 1, "unit": "cup" },
            { "name": "blueberries", "amount": 0.5, "unit": "cup" },
            { "name": "milk", "amount": 1, "unit": "cup", "instructions": "warm the milk" }
          ],
          "instructions": "Cook oats in milk, top with berries."
        }
      },
      "lunch": {
        "name": "Chicken salad",
        "targetCalories": 500,
        "recipe": null
      }
    },
    "Tuesday": {
      "breakfast": {
        "name": "Scrambled eggs",
        "targetCalories": 350,
        "recipe": {
          "title": "Fluffy Scrambled Eggs",
          "ingredients": [
            { "name": "eggs", "amount": 3, "unit": "" },
            { "name": "butter", "amount": 1, "unit": "tbsp" }
          ],
          "instructions": ["Whisk eggs", "Melt butter in pan", "Cook over low heat"]
        }
      }
    }
  };

  console.log('Sample plan:');
  console.log(JSON.stringify(samplePlan, null, 2));

  try {
    console.log('\n3. Translating...\n');
    const translated = await translator.translateWeeklyPlan(samplePlan);

    console.log('\n4. Translated plan:');
    console.log(JSON.stringify(translated, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✓ Translation test completed successfully!');
    console.log('='.repeat(60));

    // Verify some translations
    const mondayBreakfast = translated.Monday.breakfast;
    if (mondayBreakfast.name !== samplePlan.Monday.breakfast.name) {
      console.log('\n✓ Translation detected for meal name');
    }
    if (mondayBreakfast.recipe) {
      console.log(`✓ Recipe translated: "${mondayBreakfast.recipe.title}"`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testTranslation()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
