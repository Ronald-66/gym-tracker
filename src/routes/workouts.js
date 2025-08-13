import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const userId = req.session.userId;
  db.all('SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC', [userId], (err, workouts) => {
    res.render('dashboard', { title: 'Gym Tracker', workouts: workouts || [] });
  });
});

router.post(
  '/workouts',
  requireAuth,
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('exercise').trim().isLength({ min: 2 }).withMessage('Ejercicio requerido'),
  body('sets').isInt({ min: 1 }).withMessage('Series >= 1'),
  body('reps').isInt({ min: 1 }).withMessage('Reps >= 1'),
  body('weight').isFloat({ min: 0 }).withMessage('Peso >= 0'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send('Validación fallida');
    const { date, exercise, sets, reps, weight } = req.body;
    const created_at = new Date().toISOString();
    const userId = req.session.userId;
    const stmt = db.prepare('INSERT INTO workouts (user_id, date, exercise, sets, reps, weight, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(userId, date, exercise, Number(sets), Number(reps), Number(weight), created_at, (err) => {
      if (err) return res.status(500).send('Error creando entrenamiento');
      res.redirect('/');
    });
  }
);

router.get('/workouts/:id/edit', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const id = Number(req.params.id);
  db.get('SELECT * FROM workouts WHERE id = ? AND user_id = ?', [id, userId], (err, w) => {
    if (err || !w) return res.status(404).send('No encontrado');
    res.render('edit-workout', { title: 'Editar entrenamiento', w });
  });
});

router.post(
  '/workouts/:id',
  requireAuth,
  body('date').isISO8601(),
  body('exercise').trim().isLength({ min: 2 }),
  body('sets').isInt({ min: 1 }),
  body('reps').isInt({ min: 1 }),
  body('weight').isFloat({ min: 0 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).send('Validación fallida');
    const id = Number(req.params.id);
    const { date, exercise, sets, reps, weight } = req.body;
    const userId = req.session.userId;
    const stmt = db.prepare('UPDATE workouts SET date=?, exercise=?, sets=?, reps=?, weight=? WHERE id=? AND user_id=?');
    stmt.run(date, exercise, Number(sets), Number(reps), Number(weight), id, userId, function (err) {
      if (err || this.changes === 0) return res.status(404).send('No actualizado');
      res.redirect('/');
    });
  }
);

router.post('/workouts/:id/delete', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const id = Number(req.params.id);
  const stmt = db.prepare('DELETE FROM workouts WHERE id=? AND user_id=?');
  stmt.run(id, userId, function (err) {
    if (err || this.changes === 0) return res.status(404).send('No eliminado');
    res.redirect('/');
  });
});

export default router;