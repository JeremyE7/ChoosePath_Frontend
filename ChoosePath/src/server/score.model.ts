import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema({
  nickname: { type: String, required: true, maxlength: 30 },
  score: { type: Number, required: true },
  storyTitle: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

ScoreSchema.index({ score: -1 });

export const Score = mongoose.model('Score', ScoreSchema);
