const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Vocabulary = require('./models/Vocabulary');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB (Lấy string từ MongoDB Atlas)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_tam_thoi';

// --- AUTH ROUTES ---

// Đăng ký
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    res.json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists or error' });
  }
});

// Đăng nhập
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.json({ token, user: { id: user._id, email: user.email } });
});

// --- VOCABULARY ROUTES ---

// Middleware xác thực
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Lấy danh sách từ
app.get('/api/vocabulary', auth, async (req, res) => {
  const words = await Vocabulary.find({ userId: req.user.id });
  res.json(words);
});

// Thêm danh sách từ (Import CSV)
app.post('/api/vocabulary/batch', auth, async (req, res) => {
  const words = req.body.words.map(w => ({ ...w, userId: req.user.id }));
  await Vocabulary.insertMany(words);
  res.json({ success: true });
});

// Cập nhật từ (Review xong)
app.put('/api/vocabulary/:id', auth, async (req, res) => {
  const updated = await Vocabulary.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    req.body,
    { new: true }
  );
  res.json(updated);
});

// Xóa từ
app.delete('/api/vocabulary/:id', auth, async (req, res) => {
  await Vocabulary.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ success: true });
});

app.listen(5000, () => console.log('Server running on port 5000'));