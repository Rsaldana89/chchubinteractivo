require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');

const publicRoutes = require('./src/routes/public');
const adminRoutes = require('./src/routes/admin');
const apiRoutes = require('./src/routes/api');
const { attachAuthLocals } = require('./src/auth');

const app = express();
const port = Number(process.env.PORT || process.env.APP_PORT || 3000);

// Railway y otros hosting usan proxy HTTPS al frente.
// Esto permite que Express reconozca la conexión segura y guarde bien la cookie de sesión.
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  name: 'hubcentral.sid',
  secret: process.env.SESSION_SECRET || 'hubcentral-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use(attachAuthLocals);

app.use('/', publicRoutes);
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('public/error', {
    title: 'Página no encontrada',
    message: 'La página solicitada no existe.'
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).render('public/error', {
    title: status === 500 ? 'Error del servidor' : 'Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Ocurrió un problema al procesar la solicitud.'
      : err.message
  });
});

app.listen(port, () => {
  console.log(`Hub Central CHC listo en http://localhost:${port}`);
});
