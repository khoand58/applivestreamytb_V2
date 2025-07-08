const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { 
    type: String, 
    // SỬA LỖI: Thêm 'scheduled' vào danh sách các trạng thái hợp lệ
    enum: ['pending', 'downloading', 'streaming', 'completed', 'failed', 'stopped', 'scheduled'], 
    default: 'pending' 
  },
  pid: { type: Number },
  sourceLink: { type: String, required: true },
  streamKeyPartial: { type: String }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date },
  endsAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Stream', streamSchema);
