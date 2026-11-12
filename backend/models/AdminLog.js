const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, trim: true, maxlength: 100, index: true },
  resourceType: { type: String, required: true, trim: true, maxlength: 60 },
  resourceId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  description: { type: String, required: true, trim: true, maxlength: 1000 },
}, { timestamps: true });

module.exports = mongoose.model('AdminLog', AdminLogSchema);
