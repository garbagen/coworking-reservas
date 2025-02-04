// models/Reservation.js
const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  spaceId: { type: Number, required: true },
  date: { type: String, required: true },
  turno: { type: String, required: true, enum: ['mañana', 'tarde'] }, // Cambiado a "turno"
  user: { type: String, required: true }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
