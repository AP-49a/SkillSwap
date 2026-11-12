const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetType: { type: String, enum: ['course', 'user', 'review', 'session'], required: true, index: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  category: { type: String, enum: ['inappropriate_content', 'fake_profile', 'misleading_information', 'harassment', 'inappropriate_review', 'copyright', 'session_issue', 'other'], required: true },
  details: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'under_review', 'resolved', 'dismissed'], default: 'pending', index: true },
  assignedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  investigationNotes: { type: String, trim: true, maxlength: 4000, default: '' },
  resolution: { type: String, trim: true, maxlength: 1000, default: '' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

ReportSchema.index({ reporter: 1, targetType: 1, target: 1, status: 1 });

module.exports = mongoose.model('Report', ReportSchema);
