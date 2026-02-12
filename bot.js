const TelegramBot = require('node-telegram-bot-api');
const { JobDB } = require('./db');

class JobBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupHandlers();
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 
        '🤖 Welcome to Job Hunt Bot!\n\n' +
        'Commands:\n' +
        '/search <query> - Search jobs (e.g., "senior python remote")\n' +
        '/setalert <query> - Set alert for new matching jobs\n' +
        '/recent - Get 10 most recent jobs\n' +
        '/stats - View your stats'
      );
    });

    // Search command
    this.bot.onText(/\/search (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match[1];
      
      this.bot.sendMessage(chatId, `🔍 Searching for: "${query}"...`);
      
      try {
        const jobs = JobDB.searchJobs(query);
        
        if (jobs.length === 0) {
          this.bot.sendMessage(chatId, 'No jobs found matching your query.');
          return;
        }
        
        // Show top 10 results
        const topJobs = jobs.slice(0, 10);
        let response = `Found ${jobs.length} jobs. Top matches:\n\n`;
        
        for (const job of topJobs) {
          response += `📋 ${job.title}\n`;
          response += `🏢 ${job.company} | 📍 ${job.location}\n`;
          response += `🔗 ${job.url}\n\n`;
        }
        
        this.bot.sendMessage(chatId, response, { disable_web_page_preview: true });
      } catch (error) {
        this.bot.sendMessage(chatId, 'Error searching jobs. Please try again.');
      }
    });

    // Set alert command
    this.bot.onText(/\/setalert (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match[1];
      
      JobDB.saveUser(chatId.toString(), query);
      
      this.bot.sendMessage(chatId, 
        `✅ Alert set!\n\n` +
        `Query: "${query}"\n` +
        `You'll receive notifications when new matching jobs are found.`
      );
    });

    // Recent command
    this.bot.onText(/\/recent/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const jobs = JobDB.getRecentJobs(10);
        
        if (jobs.length === 0) {
          this.bot.sendMessage(chatId, 'No jobs in database yet. Try again in a few minutes.');
          return;
        }
        
        let response = `📊 ${jobs.length} most recent jobs:\n\n`;
        
        for (const job of jobs) {
          response += `📋 ${job.title.substring(0, 100)}\n`;
          response += `🏢 ${job.company} | 📍 ${job.location}\n`;
          response += `🔗 ${job.url}\n\n`;
        }
        
        this.bot.sendMessage(chatId, response, { disable_web_page_preview: true });
      } catch (error) {
        this.bot.sendMessage(chatId, 'Error fetching recent jobs.');
      }
    });

    // Stats command
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const allJobs = JobDB.getRecentJobs(10000);
        const user = JobDB.getUser(chatId.toString());
        
        let response = '📈 Job Hunt Stats:\n\n';
        response += `Total jobs in database: ${allJobs.length}\n`;
        response += `Sources: HN Who's Hiring, RemoteOK\n\n`;
        
        if (user) {
          response += `Your alert query: "${user.search_query || 'None set'}"\n`;
        }
        
        this.bot.sendMessage(chatId, response);
      } catch (error) {
        this.bot.sendMessage(chatId, 'Error fetching stats.');
      }
    });
  }

  async notifyUser(chatId, jobs) {
    if (jobs.length === 0) return;
    
    let message = `🎯 ${jobs.length} new job(s) matching your alert!\n\n`;
    
    for (const job of jobs.slice(0, 5)) {
      message += `📋 ${job.title.substring(0, 100)}\n`;
      message += `🏢 ${job.company} | 📍 ${job.location}\n`;
      message += `🔗 ${job.url}\n\n`;
    }
    
    if (jobs.length > 5) {
      message += `...and ${jobs.length - 5} more. Use /search to find them all.`;
    }
    
    try {
      await this.bot.sendMessage(chatId, message, { disable_web_page_preview: true });
    } catch (error) {
      console.error('Failed to notify user:', error.message);
    }
  }
}

module.exports = { JobBot };
