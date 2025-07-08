"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { AlertCircle, Info, X } from 'lucide-react';

// Định nghĩa các kiểu dữ liệu
interface Transaction {
    _id: string;
    planId: string;
    months: number;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: string;
}

interface Subscription {
    planId: string;
    expiresAt: string;
    purchasedAt?: string;
}

// Dữ liệu giới hạn luồng của các gói
const PLAN_LIMITS: Record<string, number> = {
    'TRIAL': 1, 'LIVE1': 1, 'LIVE3': 3, 'LIVE5': 5, 'LIVE10': 10, 'LIVE20': 20,
    'LIVE30': 30, 'LIVE50': 50, 'LIVE100': 100, 'LIVE150': 150, 'LIVE200': 200,
    'FREE': 0
};

export default function ProfilePage() {
  const { user, appUser, loading, syncAppUser } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // State để quản lý việc hiển thị thông báo gói bị xóa
  const [showDeletedWarning, setShowDeletedWarning] = useState(true);

  // Hàm lấy lịch sử giao dịch
  const fetchMyTransactions = async (uid: string) => {
    try {
        const response = await fetch('http://localhost:4000/api/my-transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firebaseUid: uid })
        });
        const data = await response.json();
        if (response.ok) {
            setTransactions(data);
        }
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử giao dịch:", error);
    }
  };

  useEffect(() => {
    if (user) {
      // Đồng bộ lại thông tin user để đảm bảo dữ liệu mới nhất
      syncAppUser(user);
      fetchMyTransactions(user.uid);
    }
  }, [user]);

  // Tính toán các thông tin cần thiết từ appUser và transactions
  const { activeSubscriptions, totalMaxStreams, deletedPlans } = useMemo(() => {
    if (!appUser) {
      return { activeSubscriptions: [], totalMaxStreams: 0, deletedPlans: [] };
    }

    const now = new Date();
    const activeSubs = appUser.subscriptions.filter(
      (sub) => new Date(sub.expiresAt) > now
    );
    
    const maxStreams = activeSubs.reduce(
      (total, sub) => total + (PLAN_LIMITS[sub.planId] || 0),
      0
    );

    // --- LOGIC SỬA LỖI PHÁT HIỆN GÓI BỊ XÓA ---
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    
    // Tạo một bản sao của mảng subscriptions để có thể thay đổi
    const availableSubscriptions = [...appUser.subscriptions]; 

    const finalDeletedPlans = completedTransactions.filter(tx => {
      // Tìm index của subscription đầu tiên khớp với transaction
      const matchingSubIndex = availableSubscriptions.findIndex(
        sub => sub.planId === tx.planId
      );

      if (matchingSubIndex > -1) {
        // Nếu tìm thấy một subscription khớp, "sử dụng" nó bằng cách xóa khỏi mảng tạm
        // để nó không được dùng để khớp cho các transaction khác
        availableSubscriptions.splice(matchingSubIndex, 1);
        return false; // Transaction này có subscription tương ứng -> không bị xóa
      }
      
      return true; // Không tìm thấy subscription nào khớp -> transaction này được coi là đã bị xóa
    });
    // --- KẾT THÚC LOGIC SỬA LỖI ---

    return {
      activeSubscriptions: activeSubs,
      totalMaxStreams: maxStreams,
      deletedPlans: finalDeletedPlans,
    };
  }, [appUser, transactions]);
  
  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return <div className="text-center">Đang tải thông tin tài khoản...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Thông tin cá nhân</h1>

      {/* Thông báo quan trọng có thể tắt */}
      {showDeletedWarning && deletedPlans.length > 0 && (
        <div className="relative rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-300">
          <button 
            onClick={() => setShowDeletedWarning(false)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-500/20 transition-colors"
            aria-label="Đóng thông báo"
          >
            <X size={20} />
          </button>
          <div className="flex items-start">
            <Info className="mr-3 h-5 w-5 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold">Thông báo quan trọng</h4>
              <p>
                Một số gói của bạn đã bị xóa bởi quản trị viên:{" "}
                <span className="font-semibold">
                  {deletedPlans.map((tx) => tx.planId).join(", ")}
                </span>
                . Vui lòng liên hệ hỗ trợ nếu bạn cần thêm thông tin.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cột thông tin người dùng và gói cước */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-lg bg-[#23233c] p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-violet-500 text-4xl font-bold">
              {appUser?.email?.[0].toUpperCase()}
            </div>
            <h2 className="text-xl font-bold">{appUser?.email}</h2>
            <p className="text-sm text-gray-400">Thành viên</p>
          </div>

          <div className="rounded-lg bg-[#23233c] p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Thông tin gói cước</h3>
            <p>Tổng số luồng tối đa: <span className="font-bold text-violet-400">{totalMaxStreams}</span></p>
            <div className="mt-4">
              <h4 className="font-medium">Các gói đang hoạt động:</h4>
              {activeSubscriptions.length > 0 ? (
                <ul className="mt-2 list-disc list-inside space-y-1 text-gray-300">
                  {activeSubscriptions.map((sub, index) => (
                    <li key={index}>
                      Gói <span className="font-semibold text-green-400">{sub.planId}</span> hết hạn ngày {new Date(sub.expiresAt).toLocaleDateString('vi-VN')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-gray-400">Bạn không có gói nào đang hoạt động.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-yellow-500/10 p-4 text-sm text-yellow-300 border border-yellow-500/30">
            <h4 className="font-bold flex items-center"><AlertCircle className="mr-2 h-5 w-5"/>Đang chờ duyệt?</h4>
            <p className="mt-1">Nếu bạn đã thanh toán nhưng gói cước chưa được kích hoạt sau 5 phút, vui lòng liên hệ hỗ trợ qua Zalo/SĐT: 0987.654.321 để được xử lý ngay lập tức.</p>
          </div>
        </div>

        {/* Cột lịch sử giao dịch */}
        <div className="md:col-span-2">
          <div className="rounded-lg bg-[#23233c] p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Lịch sử giao dịch</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700 text-xs uppercase text-gray-400">
                  <tr>
                    <th className="px-4 py-3">Gói</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3">Số tiền</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-400">Chưa có giao dịch nào.</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx._id} className="border-b border-gray-700 last:border-b-0">
                        <td className="px-4 py-3 font-semibold">{tx.planId} ({tx.months} tháng)</td>
                        <td className="px-4 py-3">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                        <td className="px-4 py-3">{tx.amount.toLocaleString('vi-VN')}đ</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-bold capitalize ${getTransactionStatusBadge(tx.status)}`}>
                            {tx.status === 'pending' ? 'Chờ xử lý' : tx.status === 'completed' ? 'Hoàn thành' : 'Thất bại'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {deletedPlans.some(deletedTx => deletedTx._id === tx._id) && (
                            <span className="text-red-400 text-xs font-medium">Gói đã bị xóa</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
