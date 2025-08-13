import path from 'node:path';
import fs from 'node:fs';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

sqlite3.verbose();
export let db;

export function initDb(dataDir) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const DB_PATH = path.join(dataDir, 'app.db');
  db = new sqlite3.Database(DB_PATH);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      exercise TEXT NOT NULL,
      sets INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  });
}

export async function ensureDemoUser() {
  return new Promise((resolve) => {
    const email = 'demo@example.com';
    const password_hash = bcrypt.hashSync('Demo12345!', 12);
    const created_at = new Date().toISOString();
    db.run(
      'INSERT OR IGNORE INTO users (email, password_hash, created_at) VALUES (?, ?, ?)',
      [email, password_hash, created_at],
      () => resolve()
    );
  });
}