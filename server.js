import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import session from 'express-session';
import SQLiteStoreInit from 'connect-sqlite3';
import csrf from 'csurf';
import rateLimit from 'express-rate-limit';
import expressLayouts from 'express-ejs-layouts';
import { fileURLToPath } from 'node:url';

import { initDb, ensureDemoUser } from './src/db.js';
import authRoutes from './src/routes/auth.js';
import workoutRoutes from './src/routes/workouts.js';
import { attachUser } from './src/middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data dir exists
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
initDb(DATA_DIR);
await ensureDemoUser();

// Views + static + layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.use('/static', express.static(path.join(__dirname, 'public')));

// Security & parsing
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Sessions
const SQLiteStore = SQLiteStoreInit(session);
const store = new SQLiteStore({ db: 'sessions.db', dir: DATA_DIR });
app.use(
  session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60 * 4 // 4h
    }
  })
);

// CSRF (after session)
app.use(csrf());
app.use(attachUser);

// Rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(['/login', '/register'], authLimiter);

// Routes
app.get('/', (req, res) => (req.session.userId ? res.redirect('/dashboard') : res.redirect('/login')));
app.use('/', authRoutes);
app.use('/dashboard', workoutRoutes);

// 404
app.use((req, res) => res.status(404).send('404: No encontrado'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gym Tracker en http://localhost:${PORT}`));
