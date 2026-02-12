const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'jobs.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    location TEXT,
    description TEXT,
    url TEXT NOT NULL,
    source TEXT NOT NULL,
    posted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(url)
  );

  CREATE TABLE IF NOT EXISTS users (
    chat_id TEXT PRIMARY KEY,
    search_query TEXT,
    last_check DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_jobs (
    chat_id TEXT,
    job_id TEXT,
    status TEXT DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (chat_id, job_id),
    FOREIGN KEY (chat_id) REFERENCES users(chat_id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
  CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
`);

class JobDB {
  static saveJob(job) {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO jobs (id, title, company, location, description, url, source, posted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(job.id, job.title, job.company, job.location, job.description, job.url, job.source, job.posted_at);
  }

  static getRecentJobs(limit = 100) {
    const stmt = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  }

  static searchJobs(query) {
    const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
    if (terms.length === 0) return [];
    
    const conditions = terms.map(() => '(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)').join(' AND ');
    const params = terms.flatMap(t => [`%${t}%`, `%${t}%`]);
    
    const stmt = db.prepare(`
      SELECT * FROM jobs 
      WHERE ${conditions}
      ORDER BY created_at DESC 
      LIMIT 50
    `);
    return stmt.all(...params);
  }

  static getUser(chatId) {
    const stmt = db.prepare('SELECT * FROM users WHERE chat_id = ?');
    return stmt.get(chatId);
  }

  static saveUser(chatId, searchQuery) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (chat_id, search_query, last_check)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    return stmt.run(chatId, searchQuery);
  }

  static getJobsForUser(chatId) {
    const stmt = db.prepare(`
      SELECT j.*, uj.status FROM jobs j
      JOIN user_jobs uj ON j.id = uj.job_id
      WHERE uj.chat_id = ?
      ORDER BY j.created_at DESC
    `);
    return stmt.all(chatId);
  }

  static markJobStatus(chatId, jobId, status) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_jobs (chat_id, job_id, status)
      VALUES (?, ?, ?)
    `);
    return stmt.run(chatId, jobId, status);
  }

  static getNewJobsSince(date) {
    const stmt = db.prepare('SELECT * FROM jobs WHERE created_at > ? ORDER BY created_at DESC');
    return stmt.all(date);
  }
}

module.exports = { JobDB, db };
