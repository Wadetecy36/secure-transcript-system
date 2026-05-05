import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE,
      role TEXT NOT NULL DEFAULT 'student', -- student, staff, admin
      dateOfBirth TEXT, -- YYYY-MM-DD
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS access_credentials (
      user_id TEXT PRIMARY KEY,
      hashed_code TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      expires_at TEXT, 
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      semester TEXT NOT NULL,
      file_key TEXT NOT NULL,
      version INTEGER NOT NULL,
      is_published INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (staff_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL, -- LOGIN, UPLOAD, VIEW, DOWNLOAD, DELETE
      resource_type TEXT NOT NULL, -- TRANSCRIPT, USER, AUTH
      resource_id TEXT,
      details TEXT, -- JSON metadata
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transcript_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- pending, fulfilling, completed, rejected
      reason TEXT,
      assigned_staff_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (assigned_staff_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_transcripts_student_id ON transcripts(student_id);
    CREATE INDEX IF NOT EXISTS idx_transcripts_is_published ON transcripts(is_published);
  `);
}

export default db;
