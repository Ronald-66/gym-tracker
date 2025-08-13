// Validaciones simples en cliente para login/registro y entrenamientos
function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function attachAuthValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', (e) => {
    const email = form.querySelector('input[name="email"]').value.trim();
    const password = form.querySelector('input[name="password"]').value;
    const errorBox = form.querySelector('.error');
    let msg = '';
    if (!validateEmail(email)) msg += 'Email inválido. ';
    if (password.length < 8) msg += 'La contraseña debe tener al menos 8 caracteres.';
    if (msg) { e.preventDefault(); errorBox.textContent = msg; }
  });
}

function attachWorkoutValidation() {
  const form = document.getElementById('workoutForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    const date = form.querySelector('input[name="date"]').value;
    const exercise = form.querySelector('input[name="exercise"]').value.trim();
    const sets = Number(form.querySelector('input[name="sets"]').value);
    const reps = Number(form.querySelector('input[name="reps"]').value);
    const weight = Number(form.querySelector('input[name="weight"]').value);
    const errorBox = form.querySelector('.error');
    let msg = '';
    if (!date) msg += 'Fecha requerida. ';
    if (exercise.length < 2) msg += 'Ejercicio muy corto. ';
    if (!(sets > 0)) msg += 'Series debe ser > 0. ';
    if (!(reps > 0)) msg += 'Reps debe ser > 0. ';
    if (!(weight >= 0)) msg += 'Peso debe ser >= 0. ';
    if (msg) { e.preventDefault(); errorBox.textContent = msg; }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  attachAuthValidation('loginForm');
  attachAuthValidation('registerForm');
  attachWorkoutValidation();
});