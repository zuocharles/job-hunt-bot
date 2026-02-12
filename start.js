require('dotenv').config();
const { JobScheduler } = require('./scheduler');
const { WebDashboard } = require('./dashboard');

const botToken = process.env.TELEGRAM_BOT_TOKEN;

console.log('🚀 Job Hunt Bot Starting...\n');

// Start scheduler (scraping + alerts)
const scheduler = new JobScheduler(botToken);
scheduler.start();

// Start web dashboard
const dashboard = new WebDashboard();
dashboard.start();

console.log('\n✅ All systems running!');
console.log('- Web dashboard: http://localhost:3000');
console.log('- Scraping every 15 minutes');
console.log('- Alert checks every 5 minutes');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});
