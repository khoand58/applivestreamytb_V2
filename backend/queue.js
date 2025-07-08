const { Queue } = require('bullmq');

const redisConnection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

const livestreamQueue = new Queue('livestreamQueue', { connection: redisConnection });

console.log("Đã kết nối với Hàng đợi 'livestreamQueue'");

module.exports = livestreamQueue;