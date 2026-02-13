/**
 * Publish simplified menu to GitHub
 */

const path = require('path');
const publisher = require('./src/publisher');

async function publish() {
  const weekLabel = '2026-W06';
  const htmlPath = path.join(__dirname, 'output/weekly', weekLabel, 'index.html');
  
  const result = await publisher.publishToGitHub(htmlPath, weekLabel);
  
  if (result.success) {
    console.log('\n✅ Published successfully!');
    console.log('View at: https://stasik5.github.io/weekly-menu/');
  } else {
    console.error('\n❌ Publishing failed:', result.error);
    process.exit(1);
  }
}

publish();
