#!/usr/bin/env node

/**
 * Main Entry Point - OpenClaw Agent Wrapper
 *
 * This is the main entry point for running the Weekly Grocery Planner
 * from an OpenClaw agent with web_search access.
 *
 * Usage:
 *   openclaw exec "cd /home/stasik5/.openclaw/workspace/grocery-planner && node agent-main.js"
 *
 * The agent-main.js will:
 * 1. Check if web_search is available
 * 2. If yes, use it to research recipes
 * 3. If no, fall back to template recipes
 * 4. Generate the full weekly menu with recipes
 * 5. Build grocery list
 * 6. Generate HTML site
 * 7. Publish to GitHub
 */

const { generateWeeklyMenu } = require('./index.js');

async function main() {
  console.log('='.repeat(60));
  console.log('Weekly Grocery Planner - OpenClaw Agent Mode');
  console.log('='.repeat(60));

  // Check if web_search is available
  if (typeof web_search !== 'undefined' && typeof web_search === 'function') {
    console.log('✓ web_search tool available - will research real recipes\n');
  } else {
    console.log('⚠️  web_search tool not available - using fallback recipes');
    console.log('   To enable web_search, run: openclaw configure --section web\n');
  }

  try {
    const result = await generateWeeklyMenu(
      typeof web_search === 'function' ? web_search : null,
      true,  // publish to GitHub
      false  // don't use agent approach (web_search is already available here)
    );

    if (result.success) {
      console.log('\n' + '='.repeat(60));
      console.log('SUCCESS!');
      console.log('='.repeat(60));
      console.log(`Week: ${result.weekLabel}`);
      console.log(`HTML: ${result.htmlPath}`);
      console.log(`JSON: ${result.jsonPath}`);
      console.log(`Published: ${result.publishResult?.success ? 'Yes' : 'No'}`);

      return result;
    } else {
      throw new Error(result.error || 'Unknown error');
    }

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('FAILED!');
    console.error('='.repeat(60));
    console.error(error.message);
    throw error;
  }
}

// Run main function
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { main };
