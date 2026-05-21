import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'voice'], default: 'text' },
  language: { type: String, default: 'en' },
  timestamp: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  messages: [messageSchema],
  language: { type: String, default: 'en' },
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Keep only last 50 messages per session for context window management
sessionSchema.pre('save', function (next) {
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-50);
  }
  next();
});

export default mongoose.model('Session', sessionSchema);
