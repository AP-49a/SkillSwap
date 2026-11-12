const mongoose = require('mongoose');

const PlatformSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'platform', unique: true },
  signupCredits: { type: Number, min: 0, max: 1000, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model('PlatformSettings', PlatformSettingsSchema);
