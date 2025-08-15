import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { db } from '../db.js';

const router = Router();

router.get('/login', (req, res) => res.render('login', { title: 'Iniciar sesión', csrfToken: req.csrfToken()  }));
router.get('/register', (req, res) => res.render('register', { title: 'Crear cuenta' , csrfToken: req.csrfToken()  }));

router.post(
  '/register',
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('register', { title: 'Crear cuenta', errors: errors.array() });
    }

    const { email, password } = req.body;
    const password_hash = bcrypt.hashSync(password, 12);
    const created_at = new Date().toISOString();

    const stmt = db.prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)');
    stmt.run(email, password_hash, created_at, function (err) {
      if (err) {
        const msg = err.message.includes('UNIQUE') ? 'Ese email ya existe.' : 'Error creando usuario.';
        return res.status(400).render('register', { title: 'Crear cuenta', errors: [{ msg }] });
      }
      req.session.userId = this.lastID;
      res.redirect('/');
    });
  }
);

router.post(
  '/login',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('login', { title: 'Iniciar sesión', errors: errors.array() });
    }

    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err || !user) return res.status(401).render('login', { title: 'Iniciar sesión', errors: [{ msg: 'Credenciales inválidas' }] });
      const ok = bcrypt.compareSync(password, user.password_hash);
      if (!ok) return res.status(401).render('login', { title: 'Iniciar sesión', errors: [{ msg: 'Credenciales inválidas' }] });
      req.session.userId = user.id;
      res.redirect('/');
    });
  }
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('sid');
    res.redirect('/login');
  });
});

export default router;
