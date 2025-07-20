// src/lib/db.js
import Database from "better-sqlite3";
import path from "path";

// Opens a persistent SQLite file
const db = new Database(path.resolve("transactions.sqlite"), { verbose: console.log });

db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    title TEXT,
    amount REAL,
    category TEXT,
    date TEXT
  )
`).run();

export default db;
