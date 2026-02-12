const http = require('http');
const { JobDB } = require('./db');
const { HNScraper, RemoteOKScraper } = require('./scrapers');
const { WeWorkRemotelyScraper, RemotiveScraper } = require('./scrapers-extra');

const PORT = process.env.PORT || 3000;

// Simple HTML template
const htmlTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <title>Job Hunt Bot Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { 
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 30px;
        }
        h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .subtitle { opacity: 0.9; font-size: 1.1rem; }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #1e293b;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }
        .stat-number { 
            font-size: 2.5rem; 
            font-weight: bold; 
            color: #6366f1;
        }
        .stat-label { color: #94a3b8; margin-top: 5px; }
        .search-box {
            background: #1e293b;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .search-box input {
            width: 100%;
            padding: 15px;
            font-size: 1rem;
            border: 2px solid #334155;
            border-radius: 8px;
            background: #0f172a;
            color: #e2e8f0;
        }
        .search-box input:focus {
            outline: none;
            border-color: #6366f1;
        }
        .jobs-list { display: flex; flex-direction: column; gap: 15px; }
        .job-card {
            background: #1e293b;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #6366f1;
            transition: transform 0.2s;
        }
        .job-card:hover { transform: translateX(5px); }
        .job-title { 
            font-size: 1.2rem; 
            font-weight: 600; 
            color: #f8fafc;
            margin-bottom: 8px;
        }
        .job-meta { 
            display: flex; 
            gap: 15px; 
            color: #94a3b8;
            font-size: 0.9rem;
            margin-bottom: 10px;
        }
        .job-source {
            background: #6366f1;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            text-transform: uppercase;
        }
        .job-description {
            color: #cbd5e1;
            font-size: 0.95rem;
            line-height: 1.5;
            max-height: 100px;
            overflow: hidden;
        }
        .job-link {
            display: inline-block;
            margin-top: 10px;
            color: #6366f1;
            text-decoration: none;
        }
        .job-link:hover { text-decoration: underline; }
        .no-results {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }
        .refresh-btn {
            background: #6366f1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin-bottom: 20px;
        }
        .refresh-btn:hover { background: #5558e0; }
        .footer {
            text-align: center;
            padding: 40px;
            color: #64748b;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <header>
        <h1>🚀 Job Hunt Bot</h1>
        <p class="subtitle">AI-powered job aggregator - Real-time remote job listings</p>
    </header>
    <div class="container">
        ${content}
    </div>
    <div class="footer">
        <p>Built with OpenClaw | Sources: HN Who's Hiring, We Work Remotely, Remotive</p>
    </div>
</body>
</html>
`;

class WebDashboard {
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
    this.hnScraper = new HNScraper();
    this.wwrScraper = new WeWorkRemotelyScraper();
    this.remotiveScraper = new RemotiveScraper();
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    if (url.pathname === '/') {
      await this.showDashboard(res);
    } else if (url.pathname === '/search') {
      const query = url.searchParams.get('q') || '';
      await this.showSearch(res, query);
    } else if (url.pathname === '/refresh') {
      await this.refreshJobs(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }

  async showDashboard(res) {
    const jobs = JobDB.getRecentJobs(20);
    const allJobs = JobDB.getRecentJobs(10000);
    
    // Calculate stats
    const stats = {
      total: allJobs.length,
      hn: allJobs.filter(j => j.source === 'hackernews').length,
      wwr: allJobs.filter(j => j.source === 'weworkremotely').length,
      remotive: allJobs.filter(j => j.source === 'remotive').length
    };

    const content = `
      <div class="stats">
        <div class="stat-card">
          <div class="stat-number">${stats.total}</div>
          <div class="stat-label">Total Jobs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.hn}</div>
          <div class="stat-label">HN Who's Hiring</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.wwr}</div>
          <div class="stat-label">We Work Remotely</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.remotive}</div>
          <div class="stat-label">Remotive</div>
        </div>
      </div>

      <div class="search-box">
        <form action="/search" method="GET">
          <input type="text" name="q" placeholder="Search jobs... (e.g., 'senior python remote', 'react frontend')" autofocus>
        </form>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>Latest ${jobs.length} Jobs</h2>
        <a href="/refresh" class="refresh-btn">↻ Refresh Jobs</a>
      </div>

      <div class="jobs-list">
        ${jobs.map(job => this.renderJobCard(job)).join('')}
      </div>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlTemplate(content));
  }

  async showSearch(res, query) {
    const jobs = query ? JobDB.searchJobs(query) : [];
    
    const content = `
      <div class="search-box">
        <form action="/search" method="GET">
          <input type="text" name="q" value="${query}" placeholder="Search jobs..." autofocus>
        </form>
      </div>

      <div style="margin-bottom: 20px;">
        <a href="/" style="color: #6366f1; text-decoration: none;">← Back to all jobs</a>
      </div>

      <h2 style="margin-bottom: 20px;">Found ${jobs.length} jobs matching "${query}"</h2>

      <div class="jobs-list">
        ${jobs.length > 0 
          ? jobs.map(job => this.renderJobCard(job)).join('')
          : '<div class="no-results">No jobs found. Try different keywords.</div>'
        }
      </div>
    `;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlTemplate(content));
  }

  async refreshJobs(res) {
    // Trigger scraping
    const [hnJobs, wwrJobs, remotiveJobs] = await Promise.all([
      this.hnScraper.scrape(),
      this.wwrScraper.scrape(),
      this.remotiveScraper.scrape()
    ]);
    
    const allJobs = [...hnJobs, ...wwrJobs, ...remotiveJobs];
    let saved = 0;
    
    for (const job of allJobs) {
      const result = JobDB.saveJob(job);
      if (result.changes > 0) saved++;
    }

    res.writeHead(302, { 'Location': '/' });
    res.end(`Refreshed! Found ${saved} new jobs.`);
  }

  renderJobCard(job) {
    return `
      <div class="job-card">
        <div class="job-title">${this.escapeHtml(job.title)}</div>
        <div class="job-meta">
          <span>🏢 ${this.escapeHtml(job.company)}</span>
          <span>📍 ${this.escapeHtml(job.location)}</span>
          <span class="job-source">${job.source}</span>
        </div>
        <div class="job-description">${this.escapeHtml(job.description || '').substring(0, 200)}...</div>
        <a href="${job.url}" target="_blank" class="job-link">View Job →</a>
      </div>
    `;
  }

  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  start() {
    this.server.listen(PORT, () => {
      console.log(`🌐 Web dashboard running on http://localhost:${PORT}`);
    });
  }
}

module.exports = { WebDashboard };
