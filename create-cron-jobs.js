#!/usr/bin/env node

/**
 * Generate cron job definitions for Weekly Grocery Planner
 * This will output JSON to be added to ~/.openclaw/cron/jobs.json
 */

const { v4: uuidv4 } = require('crypto');

function generateUUID() {
  // Simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Calculate next Sunday 3:00 AM UTC
function getNextSunday3AM() {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const daysUntilSunday = (7 - currentDay) % 7 || 7; // If today is Sunday, use next Sunday
  const nextSunday = new Date(now);
  nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
  nextSunday.setUTCHours(3, 0, 0, 0);
  return nextSunday.getTime();
}

// Calculate next Sunday 4:00 AM UTC
function getNextSunday4AM() {
  const now = new Date();
  const currentDay = now.getUTCDay();
  const daysUntilSunday = (7 - currentDay) % 7 || 7;
  const nextSunday = new Date(now);
  nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
  nextSunday.setUTCHours(4, 0, 0, 0);
  return nextSunday.getTime();
}

// Get Telegram user ID from config
const TELEGRAM_USER_ID = '260260935'; // From the existing cron jobs

// Cron expression: every Sunday at 3:00 AM UTC and 4:00 AM UTC
// Cron format: min hour day month weekday
// UTC timezone: Sunday is 0
const SUNDAY_3AM_CRON = '0 3 * * 0';
const SUNDAY_4AM_CRON = '0 4 * * 0';

const jobs = [
  {
    id: generateUUID(),
    agentId: 'stasik',
    name: 'Menu Generator',
    enabled: true,
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    schedule: {
      kind: 'cron',
      cronExpression: SUNDAY_3AM_CRON
    },
    sessionTarget: 'isolated',
    wakeMode: 'next-heartbeat',
    payload: {
      kind: 'agentTurn',
      message: 'Generate weekly menu for Grocery Planner. Run the full pipeline at /home/stasik5/.openclaw/workspace/grocery-planner. Use node index.js with proper error handling.',
      deliver: false, // Don't deliver to Telegram - this runs autonomously
      timeoutSec: 600, // 10 minutes timeout
      priority: 'normal'
    },
    state: {
      lastRunAtMs: null,
      lastStatus: null,
      lastDurationMs: null
    }
  },
  {
    id: generateUUID(),
    agentId: 'stasik',
    name: 'Menu Reviewer',
    enabled: true,
    createdAtMs: Date.now(),
    updatedAtMs: Date.now(),
    schedule: {
      kind: 'cron',
      cronExpression: SUNDAY_4AM_CRON
    },
    sessionTarget: 'isolated',
    wakeMode: 'next-heartbeat',
    payload: {
      kind: 'agentTurn',
      message: `Review the generated weekly menu and send notification to Telegram user ${TELEGRAM_USER_ID}. 

Check:
1. The latest HTML at /home/stasik5/.openclaw/workspace/grocery-planner/docs/index.html
2. GitHub status at https://github.com/stasik5/weekly-menu

If issues found, re-run generation. If all good, send Telegram message:
"🍽️ Weekly menu ready for [WEEK]! View at: https://stasik5.github.io/weekly-menu/"`,
      deliver: true,
      channel: 'telegram',
      to: `telegram:${TELEGRAM_USER_ID}`,
      timeoutSec: 300 // 5 minutes timeout
    },
    state: {
      lastRunAtMs: null,
      lastStatus: null,
      lastDurationMs: null
    }
  }
];

console.log(JSON.stringify(jobs, null, 2));
