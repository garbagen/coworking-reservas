// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware para poder recibir JSON en las peticiones
app.use(express.json());

// Sirve archivos estáticos desde la carpeta "public"
app.use(express.static('public'));

// Simulamos una base de datos en memoria para las reservas
let reservations = [];

// Endpoint para obtener la lista de espacios (por ahora estática)
app.get('/api/spaces', (req, res) => {
  const spaces = [
    { id: 1, name: 'Sala 1' },
    { id: 2, name: 'Sala 2' }
  ];
  res.json(spaces);
});

// Endpoint para crear una reserva
app.post('/api/reservations', (req, res) => {
  const { spaceId, date, user } = req.body;

  // Validación básica
  if (!spaceId || !date || !user) {
    return res.status(400).json({ error: 'Faltan datos en la reserva.' });
  }

  const newReservation = {
    id: reservations.length + 1,
    spaceId,
    date,
    user
  };

  reservations.push(newReservation);
  res.status(201).json({ message: 'Reserva creada', reservation: newReservation });
});

// Levanta el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
