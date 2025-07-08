// Bước 1.3a: Thêm dòng này ở trên cùng để đọc file .env
require('dotenv').config();

const { Worker } = require('bullmq');
const { exec } = require('child_process');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('./database');
const Stream = require('./models/Stream');

// Bước 1.3c: Tạo một file credentials tạm thời từ biến môi trường
// Điều này giúp chúng ta không cần phải tải file .json lên server
const keyFilePath = path.join(__dirname, 'google-credentials-temp.json');
if (process.env.GOOGLE_CREDENTIALS_JSON) {
    fs.writeFileSync(keyFilePath, process.env.GOOGLE_CREDENTIALS_JSON);
} else {
    console.error("Lỗi: Biến môi trường GOOGLE_CREDENTIALS_JSON không được thiết lập.");
    process.exit(1); // Thoát worker nếu không có credentials
}


// --- Hàm helper để lấy File ID ---
function getFileIdFromLink(sharingLink) {
    if (!sharingLink) return null;
    const fileIdMatch = sharingLink.match(/file\/d\/([a-zA-Z0-9_-]+)/);
    return fileIdMatch ? fileIdMatch[1] : null;
}

// --- Hàm helper để tải file ---
async function downloadFile(fileId, downloadPath) {
    // Bước 1.3c: Sử dụng file credentials tạm đã tạo
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });
    console.log(`Đang tải file bằng Google Drive API, File ID: ${fileId}`);
    const dest = fs.createWriteStream(downloadPath);
    const fileResponse = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
    );
    await new Promise((resolve, reject) => {
        fileResponse.data
            .on('end', () => {
                console.log(`Đã tải xong file và lưu tại: ${downloadPath}`);
                resolve();
            })
            .on('error', (err) => {
                console.error('Lỗi khi tải stream:', err);
                reject(err);
            })
            .pipe(dest);
    });
}

// --- Worker Logic ---
// Bước 1.3d: Đọc cấu hình Redis từ file .env
const redisConnection = { 
    host: process.env.REDIS_HOST || 'localhost', 
    port: process.env.REDIS_PORT || 6379 
};

const worker = new Worker('livestreamQueue', async (job) => {
    console.log(`\nBắt đầu xử lý job #${job.id}...`);
    const { source, key: streamKey, loop, isEndScheduled, endTime } = job.data;
    const tempFileName = `temp_video_${job.id}.mp4`;
    const tempFilePath = path.join(__dirname, tempFileName);
    let ffmpegProcess = null;
    let monitoringInterval = null;

    const cleanup = () => {
        clearInterval(monitoringInterval);
        if (fs.existsSync(tempFilePath)) {
            fs.unlink(tempFilePath, (err) => {
                if (err) console.error(`Lỗi khi xóa file tạm cho job #${job.id}:`, err);
                else console.log(`Đã xóa file tạm cho job #${job.id}`);
            });
        }
    };

    try {
        await Stream.findOneAndUpdate({ jobId: job.id }, { status: 'downloading' });
        console.log(`Job #${job.id} - Trạng thái: downloading`);

        const fileId = getFileIdFromLink(source);
        if (!fileId) throw new Error('Link Google Drive không hợp lệ.');

        await downloadFile(fileId, tempFilePath);

        let durationOption = '';
        if (isEndScheduled && endTime) {
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const durationInSeconds = Math.round((end - now) / 1000);
            if (durationInSeconds > 0) {
                durationOption = `-t ${durationInSeconds}`;
                console.log(`Job #${job.id} sẽ tự động kết thúc sau ${durationInSeconds} giây.`);
            }
        }

        const rtmpUrl = `rtmp://a.rtmp.youtube.com/live2/${streamKey}`;
        const loopOption = loop && !durationOption ? '-stream_loop -1' : '';
        const command = `ffmpeg -re ${loopOption} -i "${tempFilePath}" ${durationOption} -c:v copy -c:a copy -f flv "${rtmpUrl}"`;

        console.log(`Job #${job.id} - Đang thực thi FFmpeg với exec...`);
        ffmpegProcess = exec(command);

        await Stream.findOneAndUpdate({ jobId: job.id }, { status: 'streaming', pid: ffmpegProcess.pid });
        console.log(`Job #${job.id} - Trạng thái: streaming, PID: ${ffmpegProcess.pid}`);

        monitoringInterval = setInterval(async () => {
            try {
                const currentStream = await Stream.findOne({ jobId: job.id });
                if (currentStream && currentStream.status === 'stopped') {
                    console.log(`Phát hiện yêu cầu dừng cho job #${job.id}. Đang dừng FFmpeg...`);
                    
                    // Bước 1.4: Dùng lệnh kill đa nền tảng, hoạt động trên cả Windows và Linux
                    ffmpegProcess.kill('SIGINT');
                    console.log(`Đã gửi tín hiệu dừng đến FFmpeg cho PID ${ffmpegProcess.pid}`);
                    
                    clearInterval(monitoringInterval);
                }
            } catch (e) {
                console.error(`Lỗi khi kiểm tra trạng thái job #${job.id}:`, e);
            }
        }, 5000);

        ffmpegProcess.stderr.on('data', (data) => console.error(`ffmpeg #${job.id}: ${data}`));
        
        ffmpegProcess.on('close', async (code) => {
            console.log(`FFmpeg cho job #${job.id} đã kết thúc với mã: ${code}`);
            const currentStream = await Stream.findOne({ jobId: job.id });
            const finalStatus = (currentStream && currentStream.status === 'stopped') ? 'stopped' : 'completed';
            await Stream.findOneAndUpdate({ jobId: job.id }, { status: finalStatus, pid: null });
            console.log(`Job #${job.id} - Trạng thái cuối cùng: ${finalStatus}`);
            cleanup();
        });

    } catch (error) {
        console.error(`Lỗi nghiêm trọng với job #${job.id}:`, error.message);
        await Stream.findOneAndUpdate({ jobId: job.id }, { status: 'failed', pid: null });
        cleanup();
        throw error;
    }
}, { 
    connection: redisConnection,
    lockDuration: 3600000 
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} thất bại với lỗi: ${err.message}`);
});

console.log('Worker đã sẵn sàng lắng nghe các yêu cầu livestream...');
