#!/usr/bin/env node
/**
 * System Validator - Checks if the Weekly Grocery Planner is set up correctly
 * Run this to verify the system is working properly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Weekly Grocery Planner - System Validator\n');
console.log('='.repeat(50));

let issues = [];
let warnings = [];

// 1. Check required files
console.log('\n1. Checking required files...');
const requiredFiles = [
  'index.js',
  'config.json',
  'src/menu-generator.js',
  'src/recipe-researcher.js',
  'src/chef-reviewer.js',
  'src/pantry-normalizer.js',
  'src/grocery-list-builder.js',
  'src/site-generator.js',
  'src/publisher.js',
  'src/pantry-manager.js',
  'src/recipe-fetcher.js'
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - MISSING`);
    issues.push(`Missing required file: ${file}`);
  }
}

// 2. Check config.json
console.log('\n2. Checking config.json...');
try {
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  
  if (!config.nutrition) {
    issues.push('config.json missing "nutrition" field');
  } else if (!['lower', 'medium', 'higher'].includes(config.nutrition)) {
    issues.push(`Invalid nutrition level: ${config.nutrition} (must be lower/medium/higher)`);
  } else {
    console.log(`  ✓ Nutrition level: ${config.nutrition}`);
  }
  
  if (!config.cuisine || !config.cuisine.slavicRatio || !config.cuisine.asianRatio) {
    warnings.push('config.json missing cuisine ratios');
  } else {
    console.log(`  ✓ Cuisine ratio: ${config.cuisine.slavicRatio}/${config.cuisine.asianRatio}`);
  }
  
  if (!config.people || !Array.isArray(config.people) || config.people.length === 0) {
    issues.push('config.json missing or invalid "people" array');
  } else {
    console.log(`  ✓ People configured: ${config.people.length}`);
  }
  
  if (!config.output || !config.output.weeklyDir) {
    issues.push('config.json missing output.weeklyDir');
  } else {
    console.log(`  ✓ Output directory: ${config.output.weeklyDir}`);
  }
  
} catch (error) {
  issues.push(`Invalid config.json: ${error.message}`);
}

// 3. Check output directory
console.log('\n3. Checking output directory...');
if (fs.existsSync('output')) {
  console.log('  ✓ output/ directory exists');
  
  if (fs.existsSync('output/weekly')) {
    const weeks = fs.readdirSync('output/weekly').filter(f => f.match(/^\d{4}-W\d{2}$/));
    if (weeks.length > 0) {
      console.log(`  ✓ Found ${weeks.length} week(s) of data`);
      const latest = weeks.sort().reverse()[0];
      console.log(`    Latest: ${latest}`);
    } else {
      warnings.push('No weekly data found in output/weekly/');
    }
  } else {
    warnings.push('output/weekly/ directory not found');
  }
} else {
  warnings.push('output/ directory not found (will be created on first run)');
}

// 4. Check docs directory
console.log('\n4. Checking docs/ directory...');
if (fs.existsSync('docs')) {
  console.log('  ✓ docs/ directory exists');
  
  if (fs.existsSync('docs/index.html')) {
    const stats = fs.statSync('docs/index.html');
    const daysSinceUpdate = Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24));
    console.log(`  ✓ docs/index.html exists (last updated ${daysSinceUpdate} day(s) ago)`);
    
    if (daysSinceUpdate > 7) {
      warnings.push(`docs/index.html hasn't been updated in ${daysSinceUpdate} days`);
    }
  } else {
    warnings.push('docs/index.html not found (run node index.js to generate)');
  }
} else {
  warnings.push('docs/ directory not found');
}

// 5. Check git repository
console.log('\n5. Checking git repository...');
if (fs.existsSync('.git')) {
  console.log('  ✓ Git repository initialized');
  
  try {
    const { execSync } = require('child_process');
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    console.log(`  ✓ Current branch: ${branch}`);
    
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim().length > 0) {
      const changes = status.trim().split('\n').length;
      warnings.push(`Git has ${changes} uncommitted change(s)`);
    } else {
      console.log('  ✓ Working tree clean');
    }
    
    const remote = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf8' }).trim();
    if (remote) {
      console.log(`  ✓ Remote configured: ${remote}`);
    } else {
      warnings.push('No git remote configured');
    }
  } catch (error) {
    warnings.push(`Git check failed: ${error.message}`);
  }
} else {
  warnings.push('Not a git repository (GitHub Pages requires git)');
}

// 6. Check Node.js version
console.log('\n6. Checking Node.js environment...');
const nodeVersion = process.version;
console.log(`  ✓ Node.js version: ${nodeVersion}`);

const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 14) {
  issues.push(`Node.js version too old (${nodeVersion}), recommend 14 or higher`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('VALIDATION SUMMARY\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ ALL CHECKS PASSED\n');
  console.log('The system is properly configured and ready to use.');
  console.log('\nTo generate a weekly menu:');
  console.log('  node index.js');
  process.exit(0);
}

if (issues.length > 0) {
  console.log('❌ CRITICAL ISSUES FOUND:\n');
  issues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`);
  });
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (non-critical):\n');
  warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`);
  });
  console.log();
}

if (issues.length > 0) {
  console.log('Please fix the critical issues above before running the system.\n');
  process.exit(1);
} else {
  console.log('System is functional but has some warnings.\n');
  console.log('You can proceed, but consider addressing the warnings.\n');
  process.exit(0);
}
