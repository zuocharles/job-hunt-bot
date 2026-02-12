const { JobDB } = require('./db');
const { HNScraper, RemoteOKScraper } = require('./scrapers');
const { WeWorkRemotelyScraper, RemotiveScraper } = require('./scrapers-extra');
const { JobBot } = require('./bot');
const cron = require('node-cron');

class JobScheduler {
  constructor(botToken) {
    this.hnScraper = new HNScraper();
    this.remoteOKScraper = new RemoteOKScraper();
    this.wwrScraper = new WeWorkRemotelyScraper();
    this.remotiveScraper = new RemotiveScraper();
    this.bot = botToken ? new JobBot(botToken) : null;
    
    // Track last check time for alert matching
    this.lastAlertCheck = new Date().toISOString();
  }

  async scrapeAll() {
    console.log('🔄 Starting job scraping...');
    const startTime = Date.now();
    
    // Scrape all sources
    const [hnJobs, remoteOKJobs, wwrJobs, remotiveJobs] = await Promise.all([
      this.hnScraper.scrape(),
      this.remoteOKScraper.scrape(),
      this.wwrScraper.scrape(),
      this.remotiveScraper.scrape()
    ]);
    
    const allJobs = [...hnJobs, ...remoteOKJobs, ...wwrJobs, ...remotiveJobs];
    
    // Save to database
    let newCount = 0;
    for (const job of allJobs) {
      const result = JobDB.saveJob(job);
      if (result.changes > 0) newCount++;
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Scraped ${allJobs.length} jobs (${newCount} new) in ${duration}ms`);
    
    return newCount;
  }

  async checkAlerts() {
    console.log('🔔 Checking user alerts...');
    
    // Get all users with alerts
    const db = require('./db').db;
    const users = db.prepare('SELECT * FROM users WHERE search_query IS NOT NULL').all();
    
    // Get new jobs since last check
    const newJobs = JobDB.getNewJobsSince(this.lastAlertCheck);
    this.lastAlertCheck = new Date().toISOString();
    
    if (newJobs.length === 0) {
      console.log('No new jobs to check against alerts');
      return;
    }
    
    console.log(`Checking ${newJobs.length} new jobs against ${users.length} user alerts`);
    
    for (const user of users) {
      if (!user.search_query) continue;
      
      const query = user.search_query.toLowerCase();
      const terms = query.split(' ').filter(t => t.length > 2);
      
      const matchingJobs = newJobs.filter(job => {
        const text = `${job.title} ${job.description} ${job.company}`.toLowerCase();
        return terms.every(term => text.includes(term));
      });
      
      if (matchingJobs.length > 0 && this.bot) {
        console.log(`Notifying user ${user.chat_id} about ${matchingJobs.length} jobs`);
        await this.bot.notifyUser(user.chat_id, matchingJobs);
      }
    }
  }

  start() {
    // Initial scrape
    this.scrapeAll();
    
    // Schedule scraping every 15 minutes
    cron.schedule('*/15 * * * *', () => {
      this.scrapeAll();
    });
    
    // Schedule alert checking every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.checkAlerts();
    });
    
    console.log('⏰ Scheduler started');
    console.log('- Scraping every 15 minutes');
    console.log('- Checking alerts every 5 minutes');
  }
}

module.exports = { JobScheduler };
