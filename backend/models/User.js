const mongoose = require('mongoose');

// Cấu trúc cho một gói đăng ký riêng lẻ
const subscriptionSchema = new mongoose.Schema({
  planId: { type: String, required: true },
  purchasedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // THAY ĐỔI: Dùng một mảng để lưu nhiều gói
  subscriptions: [subscriptionSchema], 
});

module.exports = mongoose.model('User', userSchema);
