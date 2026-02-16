
import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

// Database Initialization
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    role TEXT,
    createdAt INTEGER
  );
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    userId TEXT,
    title TEXT,
    description TEXT,
    dueDate TEXT,
    priority TEXT,
    category TEXT,
    completed INTEGER,
    createdAt INTEGER,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Bootstrap Admin
const bootstrapAdmin = () => {
  try {
    const adminId = 'admin-root-id';
    const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(adminId);
    if (!exists) {
      db.prepare('INSERT INTO users (id, username, role, createdAt) VALUES (?, "admin", "admin", ?)')
        .run(adminId, Date.now());
      console.log("Admin account bootstrapped successfully.");
    }
  } catch (e) { 
    console.error("Admin bootstrap failed:", e.message); 
  }
};
bootstrapAdmin();

app.use(cors());
app.use(express.json());

// API ROUTES
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/users', (req, res) => {
  const { id, username, role, createdAt } = req.body;
  try {
    db.prepare('INSERT OR IGNORE INTO users (id, username, role, createdAt) VALUES (?, ?, ?, ?)')
      .run(id, username, role, createdAt);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reminders', (req, res) => {
  const { userId } = req.query;
  try {
    if (!userId) return res.status(400).json({ error: "userId required" });
    const data = db.prepare('SELECT * FROM reminders WHERE userId = ?').all(userId);
    res.json(data.map(r => ({ ...r, completed: !!r.completed })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/reminders/all', (req, res) => {
  try {
    const data = db.prepare('SELECT * FROM reminders').all();
    res.json(data.map(r => ({ ...r, completed: !!r.completed })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/reminders', (req, res) => {
  const { id, userId, title, description, dueDate, priority, category, completed, createdAt } = req.body;
  try {
    db.prepare(`INSERT INTO reminders (id, userId, title, description, dueDate, priority, category, completed, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, userId, title, description, dueDate, priority, category, completed ? 1 : 0, createdAt);
    res.json({ success: true });
  } catch (e) {
    console.error("Insert failed:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/reminders/:id', (req, res) => {
  const { title, description, dueDate, priority, category, completed } = req.body;
  try {
    db.prepare(`UPDATE reminders SET title=?, description=?, dueDate=?, priority=?, category=?, completed=? WHERE id=?`)
      .run(title, description, dueDate, priority, category, completed ? 1 : 0, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/reminders/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  if (req.params.id === 'admin-root-id') return res.status(403).json({ error: 'Root admin locked' });
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// JSON Fallback for missing API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl} not found` });
});

// Serve static files last
app.use(express.static(__dirname));

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
