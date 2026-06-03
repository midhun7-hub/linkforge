import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customAlias: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  shortUrl: {
    type: String,
    required: true
  },
  clickCount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active'
  },
  passwordProtected: {
    type: Boolean,
    default: false
  },
  passwordHash: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

urlSchema.index({ shortCode: 1, customAlias: 1 });

export default mongoose.model('Url', urlSchema);
