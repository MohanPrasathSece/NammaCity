const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, service: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
