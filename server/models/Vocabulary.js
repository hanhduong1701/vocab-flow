const mongoose = require('mongoose');

const VocabularySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vocabulary: { type: String, required: true },
  meaning_vi: String,
  meaning_en: String,
  example_en: String,
  type: String,
  ipa: String,
  topic: String,
  level: { type: Number, default: 1 },
  next_review: { type: Date, default: Date.now },
  last_reviewed: Date,
  correct_count: { type: Number, default: 0 },
  incorrect_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Vocabulary', VocabularySchema);