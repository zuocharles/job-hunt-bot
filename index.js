require('dotenv').config();
const { JobScheduler } = require('./scheduler');

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.log('⚠️  No TELEGRAM_BOT_TOKEN found. Running in scrape-only mode.');
  console.log('Set TELEGRAM_BOT_TOKEN in .env file to enable bot notifications.\n');
}

const scheduler = new JobScheduler(botToken);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

console.log('🚀 Job Hunt Bot Starting...\n');
scheduler.start();

// Keep process alive
setInterval(() => {}, 1000);
