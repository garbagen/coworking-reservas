// models/Reservation.js
const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  spaceId: { type: Number, required: true },
  date: { type: Date, required: true },
  user: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Reservation', ReservationSchema);
