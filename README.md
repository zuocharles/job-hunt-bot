# Job Hunt Bot

AI-powered job aggregator that monitors multiple sources and sends real-time alerts via Telegram.

## Features

- **Multi-source scraping**: HN Who's Hiring, We Work Remotely, Remotive
- **Natural language search**: "senior python remote", "javascript frontend"
- **Real-time alerts**: Get notified when new matching jobs are posted
- **Telegram bot interface**: Easy commands to search and manage alerts

## Commands

- `/search <query>` - Search jobs (e.g., "senior python remote")
- `/setalert <query>` - Set alert for new matching jobs
- `/recent` - Get 10 most recent jobs
- `/stats` - View your stats

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

3. Run:
```bash
npm start
```

## How It Works

1. Scrapers run every 15 minutes to fetch new jobs
2. Jobs are stored in SQLite database
3. Alert checker runs every 5 minutes
4. Matching jobs are sent via Telegram

## Sources

- Hacker News "Who is Hiring" (monthly thread)
- We Work Remotely RSS feed
- Remotive API

## Tech Stack

- Node.js
- SQLite (better-sqlite3)
- Telegram Bot API
- node-cron for scheduling
- axios + cheerio for scraping
