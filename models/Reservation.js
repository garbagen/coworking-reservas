// models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  spaceId: { type: Number, required: true },
  date: { type: Date, required: true },
  turn: { type: String, enum: ['mañana', 'tarde'], required: true }, // nuevo campo
  user: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);
