import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/content_bridge.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    points INTEGER DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 内容生成记录表
  CREATE TABLE IF NOT EXISTS content_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    topic TEXT NOT NULL,
    platform TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    points_cost INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 积分充值记录表
  CREATE TABLE IF NOT EXISTS point_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface User {
  id: number;
  phone: string;
  password: string;
  nickname: string;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface QueryResult {
  changes: number;
  lastInsertRowid: number;
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  try {
    const stmt = db.prepare(sql);
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return stmt.all(...params) as T[];
    } else {
      const result = stmt.run(...params) as unknown as QueryResult;
      return [{ changes: result.changes, lastInsertRowid: result.lastInsertRowid }] as T[];
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper for insert with returning
export function queryWithReturning<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}
