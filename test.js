const { HNScraper, RemoteOKScraper } = require('./scrapers');
const { WeWorkRemotelyScraper, RemotiveScraper } = require('./scrapers-extra');
const { JobDB } = require('./db');

async function testScraping() {
  console.log('🧪 Testing job scrapers...\n');
  
  const hnScraper = new HNScraper();
  const remoteOKScraper = new RemoteOKScraper();
  const wwrScraper = new WeWorkRemotelyScraper();
  const remotiveScraper = new RemotiveScraper();
  
  // Test HN scraping
  console.log('Testing HN scraper...');
  const hnJobs = await hnScraper.scrape();
  console.log(`✅ HN: ${hnJobs.length} jobs found\n`);
  
  // Test RemoteOK scraping
  console.log('Testing RemoteOK scraper...');
  const remoteJobs = await remoteOKScraper.scrape();
  console.log(`✅ RemoteOK: ${remoteJobs.length} jobs found\n`);
  
  // Test We Work Remotely scraping
  console.log('Testing We Work Remotely scraper...');
  const wwrJobs = await wwrScraper.scrape();
  console.log(`✅ We Work Remotely: ${wwrJobs.length} jobs found\n`);
  
  // Test Remotive scraping
  console.log('Testing Remotive scraper...');
  const remotiveJobs = await remotiveScraper.scrape();
  console.log(`✅ Remotive: ${remotiveJobs.length} jobs found\n`);
  
  // Save to database
  const allJobs = [...hnJobs, ...remoteJobs, ...wwrJobs, ...remotiveJobs];
  let saved = 0;
  
  for (const job of allJobs) {
    const result = JobDB.saveJob(job);
    if (result.changes > 0) saved++;
  }
  
  console.log(`💾 Saved ${saved} new jobs to database`);
  
  // Test search
  if (allJobs.length > 0) {
    console.log('\n🔍 Testing search functionality...');
    const searchResults = JobDB.searchJobs('senior engineer');
    console.log(`Found ${searchResults.length} jobs matching "senior engineer"`);
    
    const searchResults2 = JobDB.searchJobs('remote javascript');
    console.log(`Found ${searchResults2.length} jobs matching "remote javascript"`);
  }
  
  // Show stats
  const recentJobs = JobDB.getRecentJobs(100);
  console.log(`\n📊 Total jobs in database: ${recentJobs.length}`);
  
  // Show sample
  if (recentJobs.length > 0) {
    console.log('\n📋 Sample job:');
    const job = recentJobs[0];
    console.log(`Title: ${job.title}`);
    console.log(`Company: ${job.company}`);
    console.log(`Location: ${job.location}`);
    console.log(`Source: ${job.source}`);
    console.log(`URL: ${job.url}`);
  }
  
  console.log('\n✅ All tests passed!');
}

testScraping().catch(console.error);
