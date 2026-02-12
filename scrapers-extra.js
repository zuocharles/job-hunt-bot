const axios = require('axios');

class WeWorkRemotelyScraper {
  async scrape() {
    try {
      // We Work Remotely RSS feed
      const res = await axios.get('https://weworkremotely.com/remote-jobs.rss', { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)'
        }
      });
      
      const xml = res.data;
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      const jobs = [];
      
      for (const item of items.slice(0, 50)) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const descMatch = item.match(/<description>(.*?)<\/description>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        
        if (!titleMatch) continue;
        
        const title = this.decodeHtml(titleMatch[1]);
        const company = title.split(':')[0] || 'Unknown';
        
        const job = {
          id: `wwr_${Buffer.from(title).toString('base64').substring(0, 20)}`,
          title: title,
          company: company,
          location: 'Remote',
          description: descMatch ? this.decodeHtml(descMatch[1]).substring(0, 2000) : '',
          url: linkMatch ? linkMatch[1] : '',
          source: 'weworkremotely',
          posted_at: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString()
        };
        
        jobs.push(job);
      }
      
      console.log(`Scraped ${jobs.length} jobs from We Work Remotely`);
      return jobs;
    } catch (error) {
      console.error('We Work Remotely scraping error:', error.message);
      return [];
    }
  }
  
  decodeHtml(html) {
    return html
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

class RemotiveScraper {
  async scrape() {
    try {
      const res = await axios.get('https://remotive.com/api/remote-jobs', { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)'
        }
      });
      
      const jobs = [];
      
      for (const item of res.data.jobs || []) {
        const job = {
          id: `remotive_${item.id}`,
          title: item.title,
          company: item.company_name || 'Unknown',
          location: item.candidate_required_location || 'Remote',
          description: item.description ? item.description.substring(0, 2000) : '',
          url: item.url || item.apply_url || '',
          source: 'remotive',
          posted_at: new Date(item.publication_date || Date.now()).toISOString()
        };
        
        jobs.push(job);
      }
      
      console.log(`Scraped ${jobs.length} jobs from Remotive`);
      return jobs;
    } catch (error) {
      console.error('Remotive scraping error:', error.message);
      return [];
    }
  }
}

module.exports = { WeWorkRemotelyScraper, RemotiveScraper };
