const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Sẽ được mã hóa
});

module.exports = mongoose.model('User', UserSchema);