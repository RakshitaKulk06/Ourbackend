const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    workshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'ended'], default: 'active', index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },

    currentQrToken: { type: String },
    qrGeneratedAt: { type: Date },

    totalRegistered: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// A workshop should not have two active sessions running at once.
attendanceSessionSchema.index(
  { workshop: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

module.exports =
  mongoose.models.AttendanceSession ||
  mongoose.model('AttendanceSession', attendanceSessionSchema);
