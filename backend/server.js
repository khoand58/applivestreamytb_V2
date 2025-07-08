require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
require('./database');
const Stream = require('./models/Stream');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const livestreamQueue = require('./queue');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// --- Dữ liệu gói cước và giới hạn ---
const PLAN_LIMITS = {
    'TRIAL': 1, 'LIVE1': 1, 'LIVE3': 3, 'LIVE5': 5, 'LIVE10': 10, 'LIVE20': 20,
    'LIVE30': 30, 'LIVE50': 50, 'LIVE100': 100, 'LIVE150': 150, 'LIVE200': 200,
    'FREE': 0
};

// --- Middleware ---
// Hoàn lại middleware gốc, chỉ cần đọc từ body vì các request cần xác thực đều là POST
const findUserByUid = async (req, res, next) => {
    const { firebaseUid } = req.body;
    if (!firebaseUid) {
        return res.status(401).json({ message: 'Yêu cầu thiếu thông tin xác thực.' });
    }
    try {
        req.user = await User.findOne({ firebaseUid });
        if (!req.user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tìm người dùng.' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') next();
    else res.status(403).json({ message: 'Không có quyền truy cập.' });
};

// ===================================
// ---         API CỦA USER        ---
// ===================================

// API đồng bộ người dùng
app.post('/api/auth/sync', async (req, res) => {
    const { email, uid } = req.body;
    try {
        let user = await User.findOne({ firebaseUid: uid });
        const isAdminEmail = email === 'quanhien1803@gmail.com';
        if (!user) {
            const trialExpiresAt = new Date();
            trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);
            user = new User({
                firebaseUid: uid,
                email: email,
                role: isAdminEmail ? 'admin' : 'user',
                subscriptions: [{ planId: 'TRIAL', purchasedAt: new Date(), expiresAt: trialExpiresAt }]
            });
            await user.save();
        } else if (isAdminEmail && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi đồng bộ người dùng.' });
    }
});

// API tạo stream
app.post('/api/start-stream', findUserByUid, async (req, res) => {
    const user = req.user;
    const streamData = req.body;
    try {
        const now = new Date();
        const activeSubscriptions = user.subscriptions.filter(sub => new Date(sub.expiresAt) > now);
        const totalMaxStreams = activeSubscriptions.reduce((total, sub) => total + (PLAN_LIMITS[sub.planId] || 0), 0);
        const activeAndScheduledStreams = await Stream.countDocuments({
            userId: user._id,
            status: { $in: ['downloading', 'streaming', 'pending', 'scheduled'] }
        });
        if (activeAndScheduledStreams >= totalMaxStreams) {
            return res.status(403).json({ message: `Bạn đã đạt giới hạn ${totalMaxStreams} luồng.` });
        }
        
        let jobOptions = {};
        let delay = 0;
        if (streamData.isScheduled && streamData.startTime) {
            const startTime = new Date(streamData.startTime).getTime();
            delay = startTime - now.getTime();
            if (delay < 0) delay = 0;
            jobOptions.delay = delay;
        }

        const job = await livestreamQueue.add('new-stream', { ...streamData, userId: user._id }, jobOptions);
        
        const newStream = new Stream({
            jobId: job.id,
            name: streamData.name,
            sourceLink: streamData.source,
            streamKeyPartial: streamData.key.slice(0, 4) + '...',
            userId: user._id,
            scheduledAt: streamData.isScheduled && streamData.startTime ? new Date(streamData.startTime) : null,
            endsAt: streamData.isEndScheduled && streamData.endTime ? new Date(streamData.endTime) : null,
            status: streamData.isScheduled && delay > 0 ? 'scheduled' : 'pending',
        });
        await newStream.save();
        res.status(200).json({ message: 'Yêu cầu đã được tiếp nhận!' });

    } catch (error) {
        console.error("Lỗi khi tạo stream:", error);
        res.status(500).json({ message: `Lỗi server: ${error.message}` });
    }
});

// *** THAY ĐỔI: API này giờ sẽ trả về cả danh sách và số luồng đang hoạt động ***
app.post('/api/my-streams', findUserByUid, async (req, res) => {
    try {
        const streams = await Stream.find({ userId: req.user._id }).sort({ createdAt: -1 });
        
        // Đếm số luồng đang có trạng thái 'streaming' hoặc 'downloading'
        const activeCount = streams.filter(s => s.status === 'streaming' || s.status === 'downloading').length;
        
        // Trả về một object chứa cả danh sách và số lượng
        res.status(200).json({
            streams: streams,
            activeCount: activeCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Không thể lấy danh sách stream.' });
    }
});

// API tạo giao dịch
app.post('/api/transactions', findUserByUid, async (req, res) => {
    const { planId, months, amount, transactionCode } = req.body;
    try {
        const uniqueTransactionCode = `${transactionCode}-${Date.now()}`;

        const newTransaction = new Transaction({
            userId: req.user._id,
            planId, months, amount, 
            transactionCode: uniqueTransactionCode,
        });
        await newTransaction.save();
        res.status(201).json({ message: 'Đã ghi nhận yêu cầu thanh toán. Chúng tôi sẽ xử lý sớm nhất.' });
    } catch (error) {
        console.error("Lỗi khi tạo giao dịch:", error);
        res.status(500).json({ message: 'Lỗi server khi tạo giao dịch.' });
    }
});

// API để người dùng lấy lịch sử giao dịch của chính họ
app.post('/api/my-transactions', findUserByUid, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử giao dịch:", error);
        res.status(500).json({ message: 'Lỗi khi lấy lịch sử giao dịch.' });
    }
});

// ===================================
// ---      API QUẢN LÝ STREAM     ---
// ===================================

app.post('/api/streams/:jobId/stop', findUserByUid, async (req, res) => {
    const { jobId } = req.params;
    try {
        const stream = await Stream.findOneAndUpdate(
            { jobId, userId: req.user._id, status: { $in: ['downloading', 'streaming'] } },
            { status: 'stopped' },
            { new: true }
        );
        if (!stream) return res.status(404).json({ message: 'Không tìm thấy luồng đang chạy để dừng.' });
        res.status(200).json({ message: 'Đã gửi yêu cầu dừng luồng live.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.delete('/api/streams/:jobId', findUserByUid, async (req, res) => {
    const { jobId } = req.params;
    try {
        const streamToDelete = await Stream.findOne({ jobId, userId: req.user._id });
        if (!streamToDelete) return res.status(404).json({ message: 'Không tìm thấy luồng live để xóa.' });
        if (['downloading', 'streaming'].includes(streamToDelete.status)) {
            return res.status(400).json({ message: 'Không thể xóa luồng đang chạy. Vui lòng dừng trước.' });
        }
        await Stream.deleteOne({ jobId });
        res.status(200).json({ message: 'Đã xóa luồng live thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.put('/api/streams/:jobId', findUserByUid, async (req, res) => {
    const { jobId } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ message: 'Tên mới không được để trống.' });
    try {
        const updatedStream = await Stream.findOneAndUpdate({ jobId, userId: req.user._id }, { name: name.trim() }, { new: true });
        if (!updatedStream) return res.status(404).json({ message: 'Không tìm thấy luồng live.' });
        res.status(200).json(updatedStream);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

app.post('/api/streams/:jobId/start-now', findUserByUid, async (req, res) => {
    const { jobId } = req.params;
    try {
        const job = await livestreamQueue.getJob(jobId);
        if (!job) return res.status(404).json({ message: 'Không tìm thấy job trong hàng đợi.' });
        
        const stream = await Stream.findOne({ jobId, userId: req.user._id });
        if (!stream) return res.status(403).json({ message: 'Không có quyền thực hiện hành động này.' });

        await job.promote();
        await Stream.findOneAndUpdate({ jobId }, { status: 'pending', scheduledAt: null });
        res.status(200).json({ message: 'Đã yêu cầu bắt đầu luồng live ngay lập tức.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});


// ===================================
// ---         API CỦA ADMIN       ---
// ===================================

app.post('/api/admin/users', findUserByUid, isAdmin, async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng.' });
    }
});

app.post('/api/admin/pending-transactions', findUserByUid, isAdmin, async (req, res) => {
    try {
        const transactions = await Transaction.find({ status: 'pending' }).populate('userId', 'email').sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy giao dịch.' });
    }
});

app.post('/api/transactions/:id/approve', findUserByUid, isAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('userId');
        if (!transaction || transaction.status !== 'pending') {
            return res.status(404).json({ message: 'Giao dịch không hợp lệ hoặc đã được xử lý.' });
        }
        const userToUpdate = transaction.userId;
        const newExpiryDate = new Date();
        newExpiryDate.setMonth(newExpiryDate.getMonth() + transaction.months);
        userToUpdate.subscriptions.push({
            planId: transaction.planId,
            purchasedAt: new Date(),
            expiresAt: newExpiryDate,
        });
        await userToUpdate.save();
        transaction.status = 'completed';
        await transaction.save();
        res.status(200).json({ message: `Đã gộp gói ${transaction.planId} thành công.` });
    } catch (error) {
        console.error("Lỗi khi phê duyệt giao dịch:", error);
        res.status(500).json({ message: 'Lỗi server khi phê duyệt giao dịch.' });
    }
});
app.delete('/api/admin/users/:userId/subscriptions/:index', findUserByUid, isAdmin, async (req, res) => {
    try {
        const { userId, index } = req.params;
        const subscriptionIndex = parseInt(index);
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        
        if (subscriptionIndex < 0 || subscriptionIndex >= user.subscriptions.length) {
            return res.status(400).json({ message: 'Index không hợp lệ.' });
        }
        
        user.subscriptions.splice(subscriptionIndex, 1);
        await user.save();
        
        res.status(200).json({ message: 'Đã xóa gói thành công.' });
    } catch (error) {
        console.error("Lỗi khi xóa subscription:", error);
        res.status(500).json({ message: 'Lỗi server khi xóa gói.' });
    }
});

app.post('/api/admin/statistics', findUserByUid, isAdmin, async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const completedTransactions = await Transaction.find({ status: 'completed' });
        const totalRevenue = completedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const totalUsers = await User.countDocuments();
        
        const revenueThisMonth = completedTransactions
            .filter(tx => new Date(tx.createdAt) >= startOfMonth)
            .reduce((sum, tx) => sum + tx.amount, 0);
            
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

        const revenueLastMonth = completedTransactions
            .filter(tx => new Date(tx.createdAt) >= startOfLastMonth && new Date(tx.createdAt) < startOfMonth)
            .reduce((sum, tx) => sum + tx.amount, 0);

        const stats = {
            totalRevenue,
            totalUsers,
            revenueThisMonth,
            newUsersThisMonth,
            revenueLastMonth,
        };
        res.status(200).json(stats);
    } catch (error) {
        console.error("Lỗi khi lấy thống kê:", error);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend API Server đang chạy tại http://localhost:${PORT}`);
});
