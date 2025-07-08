const mongoose = require('mongoose');

// Code sẽ tự động đọc chuỗi kết nối từ file .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB kết nối thành công!'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));