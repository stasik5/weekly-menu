#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const cronJobsFile = path.join(process.env.HOME, '.openclaw', 'cron', 'jobs.json');

// Read existing jobs
const jobsData = JSON.parse(fs.readFileSync(cronJobsFile, 'utf8'));

// New jobs to add
const newJobs = [
  {
    id: 'f192b0e1-15aa-4ac0-b83c-34084e8cf0f1',
    agentId: 'stasik',
    name: 'Menu Generator',
    enabled: true,
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    schedule: {
      kind: 'cron',
      cronExpression: '0 3 * * 0'
    },
    sessionTarget: 'isolated',
    wakeMode: 'next-heartbeat',
    payload: {
      kind: 'agentTurn',
      message: 'Generate weekly menu for Grocery Planner. Run the full pipeline at /home/stasik5/.openclaw/workspace/grocery-planner.\n\nSteps:\n1. cd /home/stasik5/.openclaw/workspace/grocery-planner\n2. node index.js\n\nThis will generate the menu, research recipes (with web_search if configured), and publish to GitHub.',
      deliver: false,
      timeoutSec: 600,
      priority: 'normal'
    },
    state: {
      lastRunAtMs: null,
      lastStatus: null,
      lastDurationMs: null
    }
  },
  {
    id: 'aebfe35a-a216-4e38-b3ea-97292a41f5c2',
    agentId: 'stasik',
    name: 'Menu Reviewer',
    enabled: true,
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    schedule: {
      kind: 'cron',
      cronExpression: '0 4 * * 0'
    },
    sessionTarget: 'isolated',
    wakeMode: 'next-heartbeat',
    payload: {
      kind: 'agentTurn',
      message: 'Review the generated weekly menu and send notification to Telegram.\n\n1. Check the latest HTML at /home/stasik5/.openclaw/workspace/grocery-planner/docs/index.html\n2. Verify GitHub status at https://github.com/stasik5/weekly-menu\n3. Extract the week label from the HTML (e.g., "2026-W06")\n\nIf issues found:\n- Re-run generation: cd /home/stasik5/.openclaw/workspace/grocery-planner && node index.js\n\nIf all good, send this Telegram message to user 260260935:\n"🍽️ Weekly menu ready for [WEEK_LABEL]!\n\n📊 Nutrition: Moderate level\n📦 View at: https://stasik5.github.io/weekly-menu/\n📝 GitHub: https://github.com/stasik5/weekly-menu"',
      deliver: true,
      channel: 'telegram',
      to: 'telegram:260260935',
      timeoutSec: 300
    },
    state: {
      lastRunAtMs: null,
      lastStatus: null,
      lastDurationMs: null
    }
  }
];

// Add new jobs to existing jobs
jobsData.jobs = [...jobsData.jobs, ...newJobs];

// Backup the original file
fs.writeFileSync(cronJobsFile + '.bak', JSON.stringify(JSON.parse(fs.readFileSync(cronJobsFile, 'utf8')), null, 2), 'utf8');
console.log('✓ Backed up original jobs.json');

// Write updated jobs
fs.writeFileSync(cronJobsFile, JSON.stringify(jobsData, null, 2), 'utf8');
console.log('✓ Added 2 new cron jobs');

console.log('\nNew jobs:');
newJobs.forEach(job => {
  console.log(`  - ${job.name} (enabled: ${job.enabled})`);
  console.log(`    Schedule: cron "${job.schedule.cronExpression}"`);
  console.log(`    Next run: Sunday ${job.schedule.cronExpression.split(' ')[1]}:00 UTC`);
});

console.log('\nTotal jobs:', jobsData.jobs.length);
