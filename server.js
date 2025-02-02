// server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const Reservation = require('./models/Reservation'); // Asegúrate de crear este archivo

const app = express();
const port = process.env.PORT || 3000;

// Middleware para recibir JSON y servir archivos estáticos
app.use(express.json());
app.use(express.static('public'));

// Conexión a Cosmos DB usando Mongoose
const dbURI = process.env.DB_CONNECTION_STRING; // Define esta variable en tu .env o en Application Settings de Azure
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a Cosmos DB"))
  .catch((error) => console.error("Error conectando a Cosmos DB:", error));

// Endpoint para obtener la lista de espacios (estática)
app.get('/api/spaces', (req, res) => {
  const spaces = [
    { id: 1, name: 'Sala 1' },
    { id: 2, name: 'Sala 2' }
  ];
  res.json(spaces);
});

// Endpoint para crear una reserva y guardarla en la base de datos
app.post('/api/reservations', async (req, res) => {
  const { spaceId, date, user } = req.body;

  // Validación básica de los datos
  if (!spaceId || !date || !user) {
    return res.status(400).json({ error: 'Faltan datos en la reserva.' });
  }

  try {
    // Crear y guardar la nueva reserva en Cosmos DB
    const newReservation = new Reservation({ spaceId, date, user });
    const savedReservation = await newReservation.save();
    res.status(201).json({ message: 'Reserva creada', reservation: savedReservation });
  } catch (error) {
    console.error("Error al crear reserva:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Levanta el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
// Middleware simple para autenticación básica (admin)
function adminAuth(req, res, next) {
  const auth = {
    login: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASSWORD
  };

  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  // Para depuración, puedes agregar un console.log (sólo en desarrollo)
  console.log('Credenciales recibidas:', login, password);

  if (login && password && login === auth.login && password === auth.password) {
    return next();
  }

  return res.status(401).send('Autenticación requerida.');
}
// Endpoint para obtener todas las reservas (protegido con adminAuth)
app.get('/admin/reservations', adminAuth, async (req, res) => {
  try {
    // Obtiene todas las reservas de la base de datos y las ordena por fecha descendente
    const reservations = await Reservation.find();
    res.json(reservations);
  } catch (error) {
    console.error("Error obteniendo reservas:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
