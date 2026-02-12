const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

class HNScraper {
  async scrape() {
    try {
      // Get the latest "Who is hiring?" post
      const searchUrl = 'https://hn.algolia.com/api/v1/search?query=Ask+HN+Who+is+hiring&tags=story&hitsPerPage=5';
      const searchRes = await axios.get(searchUrl, { timeout: 10000 });
      
      if (!searchRes.data.hits || searchRes.data.hits.length === 0) {
        console.log('No hiring threads found');
        return [];
      }

      const latestThread = searchRes.data.hits[0];
      const objectID = latestThread.objectID;
      
      // Get comments from the thread
      const commentsUrl = `https://hn.algolia.com/api/v1/search?tags=comment,story_${objectID}&hitsPerPage=100`;
      const commentsRes = await axios.get(commentsUrl, { timeout: 10000 });
      
      const jobs = [];
      
      for (const comment of commentsRes.data.hits || []) {
        const text = comment.comment_text || '';
        if (!text.includes('hiring') && !text.includes(' Hiring ') && !text.includes(' hiring ')) continue;
        
        // Parse job info from comment
        const lines = text.split('\n').filter(l => l.trim());
        const firstLine = lines[0] || '';
        
        // Extract company from first line (usually "Company Name | Location | Remote")
        const companyMatch = firstLine.match(/^([^|]+)/);
        const company = companyMatch ? companyMatch[1].trim() : 'Unknown';
        
        const job = {
          id: `hn_${comment.objectID}`,
          title: this.decodeHtml(firstLine.substring(0, 200)),
          company: this.decodeHtml(company),
          location: this.extractLocation(firstLine),
          description: this.decodeHtml(text.substring(0, 2000)),
          url: `https://news.ycombinator.com/item?id=${comment.objectID}`,
          source: 'hackernews',
          posted_at: new Date(comment.created_at).toISOString()
        };
        
        jobs.push(job);
      }
      
      console.log(`Scraped ${jobs.length} jobs from HN`);
      return jobs;
    } catch (error) {
      console.error('HN scraping error:', error.message);
      return [];
    }
  }
  
  extractLocation(text) {
    const match = text.match(/\|\s*([^|]+)\s*\|/);
    return match ? match[1].trim() : 'Remote/Unknown';
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

class RemoteOKScraper {
  async scrape() {
    try {
      const res = await axios.get('https://remoteok.com/api', { timeout: 10000 });
      
      const jobs = [];
      
      for (const item of res.data || []) {
        if (!item.position) continue;
        
        const job = {
          id: `remoteok_${item.id || crypto.randomUUID()}`,
          title: item.position,
          company: item.company || 'Unknown',
          location: item.location || 'Remote',
          description: item.description ? item.description.substring(0, 2000) : '',
          url: item.apply_url || item.url || `https://remoteok.com/${item.id}`,
          source: 'remoteok',
          posted_at: new Date(item.date || Date.now()).toISOString()
        };
        
        jobs.push(job);
      }
      
      console.log(`Scraped ${jobs.length} jobs from RemoteOK`);
      return jobs;
    } catch (error) {
      console.error('RemoteOK scraping error:', error.message);
      return [];
    }
  }
}

class GitHubJobsScraper {
  async scrape() {
    try {
      // GitHub Jobs API was deprecated, so we'll use a fallback
      // In production, you'd use a different source
      console.log('GitHub Jobs API deprecated, skipping');
      return [];
    } catch (error) {
      console.error('GitHub scraping error:', error.message);
      return [];
    }
  }
}

module.exports = { HNScraper, RemoteOKScraper, GitHubJobsScraper };
