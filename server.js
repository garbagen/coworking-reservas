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

// Endpoint para obtener la lista de espacios (ahora 6 spots)
app.get('/api/spaces', (req, res) => {
  const spaces = [
    { id: 1, name: 'Spot 1' },
    { id: 2, name: 'Spot 2' },
    { id: 3, name: 'Spot 3' },
    { id: 4, name: 'Spot 4' },
    { id: 5, name: 'Spot 5' },
    { id: 6, name: 'Spot 6' }
  ];
  res.json(spaces);
});


// Endpoint para crear una reserva y guardarla en la base de datos
app.post('/api/reservations', async (req, res) => {
  const { spaceId, date, turn, user } = req.body;

  // Validación básica de los datos
  if (!spaceId || !date || !turn || !user) {
    return res.status(400).json({ error: 'Faltan datos en la reserva.' });
  }

  try {
    // Convertimos la fecha a objeto Date (suponiendo que se recibe en formato YYYY-MM-DD)
    const reservationDate = new Date(date);

    // Verifica si ya existe una reserva para ese espacio, turno y día
    const existingReservation = await Reservation.findOne({
      spaceId,
      turn,
      date: reservationDate
    });

    if (existingReservation) {
      return res.status(400).json({ error: 'Ya existe una reserva para este spot, turno y día.' });
    }

    // Crear y guardar la nueva reserva en Cosmos DB
    const newReservation = new Reservation({ spaceId, date: reservationDate, turn, user });
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
// Endpoint para obtener reservas por día
app.get('/api/reservations/bydate', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Se requiere la fecha en formato YYYY-MM-DD' });
  }
  try {
    // Convertir la fecha recibida a un objeto Date y definir el rango del día
    const queryDate = new Date(date);
    const start = new Date(queryDate.setHours(0, 0, 0, 0));
    const end = new Date(queryDate.setHours(23, 59, 59, 999));
    
    // Buscar reservas dentro de ese rango de tiempo
    const reservations = await Reservation.find({
      date: { $gte: start, $lte: end }
    });
    res.json(reservations);
  } catch (error) {
    console.error("Error obteniendo reservas por fecha:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// Endpoint para actualizar una reserva (editar)
// Se espera que el cliente envíe los campos a actualizar (por ejemplo, spaceId, date, turn, user)
app.put('/api/reservations/:id', adminAuth, async (req, res) => {
  const reservationId = req.params.id;
  const { spaceId, date, turn, user } = req.body;
  
  // Opcional: validar que al menos uno de los campos a actualizar esté presente
  if (!spaceId && !date && !turn && !user) {
    return res.status(400).json({ error: 'No se enviaron datos para actualizar.' });
  }
  
  try {
    // Se actualiza la reserva y se retorna la reserva actualizada
    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { spaceId, date, turn, user },
      { new: true, runValidators: true }
    );
    if (!updatedReservation) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    res.json({ message: 'Reserva actualizada', reservation: updatedReservation });
  } catch (error) {
    console.error("Error actualizando reserva:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
// Endpoint para borrar una reserva
app.delete('/api/reservations/:id', adminAuth, async (req, res) => {
  const reservationId = req.params.id;
  try {
    const deletedReservation = await Reservation.findByIdAndDelete(reservationId);
    if (!deletedReservation) {
      return res.status(404).json({ error: 'Reserva no encontrada.' });
    }
    res.json({ message: 'Reserva borrada', reservation: deletedReservation });
  } catch (error) {
    console.error("Error borrando reserva:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
