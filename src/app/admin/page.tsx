"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth, type AppUser as AuthAppUser, type Subscription as AuthSubscription } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { X, Eye, Trash2 } from 'lucide-react';

// Định nghĩa các kiểu dữ liệu
interface Transaction {
    _id: string;
    userId: {
        _id: string;
        email: string;
    };
    planId: string;
    months: number;
    amount: number;
    transactionCode: string;
    createdAt: string;
}

// Sử dụng types từ AuthContext
type Subscription = AuthSubscription;
type AppUser = AuthAppUser;

interface StatsData {
    totalRevenue: number;
    totalUsers: number;
    revenueThisMonth: number;
    newUsersThisMonth: number;
    revenueLastMonth: number;
}

const PLAN_LIMITS: Record<string, number> = {
    'TRIAL': 1, 'LIVE1': 1, 'LIVE3': 3, 'LIVE5': 5, 'LIVE10': 10, 'LIVE20': 20,
    'LIVE30': 30, 'LIVE50': 50, 'LIVE100': 100, 'LIVE150': 150, 'LIVE200': 200,
};

// Sử dụng biến môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminPage() {
    const { user, appUser, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('stats');
    
    const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [stats, setStats] = useState<Partial<StatsData>>({});
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    // State cho modal chi tiết user
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);

    const fetchDataForAdmin = async () => {
        if (!user || appUser?.role !== 'admin') return;
        
        setIsLoadingData(true);
        try {
            const body = JSON.stringify({ firebaseUid: user.uid });
            const headers = { 'Content-Type': 'application/json' };

            const [transRes, usersRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/pending-transactions`, { method: 'POST', headers, body }),
                fetch(`${API_URL}/api/admin/users`, { method: 'POST', headers, body }),
                fetch(`${API_URL}/api/admin/statistics`, { method: 'POST', headers, body })
            ]);

            if (transRes.ok) setPendingTransactions(await transRes.json());
            if (usersRes.ok) setAllUsers(await usersRes.json());
            if (statsRes.ok) setStats(await statsRes.json());

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu admin:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (!loading && appUser?.role === 'admin') {
            fetchDataForAdmin();
        }
    }, [loading, appUser]);

    const handleApprove = async (transactionId: string) => {
        if (!user || !confirm('Bạn chắc chắn muốn phê duyệt giao dịch này?')) return;
        try {
            const response = await fetch(`${API_URL}/api/transactions/${transactionId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseUid: user.uid })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('Phê duyệt thành công!');
            fetchDataForAdmin();
        } catch (error: any) {
            alert(`Lỗi khi phê duyệt: ${error.message}`);
        }
    };

    const handleDeleteSubscription = async (userId: string, subscriptionIndex: number) => {
        if (!user || !confirm('Bạn chắc chắn muốn xóa gói này? Hành động này không thể hoàn tác!')) return;
        try {
            const response = await fetch(`${API_URL}/api/admin/users/${userId}/subscriptions/${subscriptionIndex}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firebaseUid: user.uid })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert('Đã xóa gói thành công!');
            fetchDataForAdmin();
            // Refresh selected user detail
            if (selectedUser && selectedUser._id === userId) {
                const updatedUser = allUsers.find(u => u._id === userId);
                if (updatedUser) setSelectedUser(updatedUser);
            }
        } catch (error: any) {
            alert(`Lỗi khi xóa gói: ${error.message}`);
        }
    };

    if (loading) return <p className="p-8 text-center">Đang tải...</p>;
    if (!user || appUser?.role !== 'admin') {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-500">Truy cập bị từ chối</h1>
                <p>Bạn không có quyền truy cập vào trang này.</p>
                <button onClick={() => router.push('/')} className="mt-4 rounded bg-violet-600 px-4 py-2">Về trang chủ</button>
            </div>
        );
    }

    const revenueChange = stats.revenueLastMonth! > 0 
        ? ((stats.revenueThisMonth! - stats.revenueLastMonth!) / stats.revenueLastMonth!) * 100 
        : stats.revenueThisMonth! > 0 ? 100 : 0;

    // Modal chi tiết user
    const UserDetailModal = () => {
        if (!showUserDetail || !selectedUser) return null;

        const now = new Date();
        const allSubs = selectedUser.subscriptions || [];
        const activeSubs = allSubs.filter(sub => new Date(sub.expiresAt) > now);
        const expiredSubs = allSubs.filter(sub => new Date(sub.expiresAt) <= now);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-[#1a1a2e] rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Chi tiết người dùng: {selectedUser.email}</h2>
                        <button onClick={() => setShowUserDetail(false)} className="text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Thông tin tổng quan */}
                        <div className="bg-[#23233c] p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Thông tin tổng quan</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-400">Email:</span>
                                    <span className="ml-2">{selectedUser.email}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Role:</span>
                                    <span className="ml-2">{selectedUser.role}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Tổng gói đã mua:</span>
                                    <span className="ml-2">{allSubs.length}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Gói đang hoạt động:</span>
                                    <span className="ml-2 text-green-400">{activeSubs.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách tất cả các gói */}
                        <div className="bg-[#23233c] p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Tất cả các gói ({allSubs.length})</h3>
                            <div className="space-y-3">
                                {allSubs.length === 0 ? (
                                    <p className="text-gray-400">Chưa mua gói nào</p>
                                ) : (
                                    allSubs.map((sub, index) => {
                                        const isExpired = new Date(sub.expiresAt) <= now;
                                        const purchaseDate = sub.purchasedAt 
                                            ? new Date(sub.purchasedAt).toLocaleDateString('vi-VN')
                                            : 'N/A';
                                        const expireDate = sub.expiresAt
                                            ? new Date(sub.expiresAt).toLocaleDateString('vi-VN')
                                            : 'N/A';

                                        return (
                                            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isExpired ? 'bg-gray-800' : 'bg-gray-700'}`}>
                                                <div className="flex-1">
                                                    <span className={`font-semibold ${isExpired ? 'text-gray-500 line-through' : 'text-violet-400'}`}>
                                                        {sub.planId || 'Unknown'}
                                                    </span>
                                                    <span className="text-sm text-gray-400 ml-3">
                                                        {purchaseDate} → {expireDate}
                                                    </span>
                                                    {isExpired && <span className="text-red-400 ml-2 text-sm">(Hết hạn)</span>}
                                                    {!isExpired && <span className="text-green-400 ml-2 text-sm">(Còn hạn)</span>}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSubscription(selectedUser._id, index)}
                                                    className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition"
                                                    title="Xóa gói này"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Tổng số luồng hiện tại */}
                        <div className="bg-[#23233c] p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">Tổng số luồng hiện tại</h3>
                            <div className="text-3xl font-bold text-green-400">
                                {activeSubs.reduce((total, sub) => total + (PLAN_LIMITS[sub.planId] || 0), 0)}
                            </div>
                            {activeSubs.length > 0 && (
                                <div className="text-sm text-gray-500 mt-2">
                                    = {activeSubs.map(sub => `${sub.planId}(${PLAN_LIMITS[sub.planId] || 0})`).join(' + ')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            <h1 className="mb-8 text-3xl font-bold">Trang Quản trị</h1>
            <div className="mb-6 flex border-b border-gray-700">
                <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'stats' ? 'border-b-2 border-violet-500 text-white' : 'text-gray-400 hover:text-white'}`}>Thống kê</button>
                <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'transactions' ? 'border-b-2 border-violet-500 text-white' : 'text-gray-400 hover:text-white'}`}>Giao dịch chờ duyệt ({pendingTransactions.length})</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-medium transition-colors ${activeTab === 'users' ? 'border-b-2 border-violet-500 text-white' : 'text-gray-400 hover:text-white'}`}>Quản lý người dùng ({allUsers.length})</button>
            </div>

            {isLoadingData ? <p>Đang tải dữ liệu...</p> : (
                <>
                    {activeTab === 'stats' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           <div className="bg-[#23233c] p-6 rounded-lg">
                                <h3 className="text-gray-400 text-sm font-medium">Tổng doanh thu</h3>
                                <p className="text-3xl font-bold text-white mt-2">{stats.totalRevenue?.toLocaleString('vi-VN')}đ</p>
                           </div>
                           <div className="bg-[#23233c] p-6 rounded-lg">
                                <h3 className="text-gray-400 text-sm font-medium">Doanh thu tháng này</h3>
                                <p className="text-3xl font-bold text-white mt-2">{stats.revenueThisMonth?.toLocaleString('vi-VN')}đ</p>
                                <p className={`text-sm ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {revenueChange >= 0 ? '▲' : '▼'} {Math.abs(revenueChange).toFixed(1)}% so với tháng trước
                                </p>
                           </div>
                            <div className="bg-[#23233c] p-6 rounded-lg">
                                <h3 className="text-gray-400 text-sm font-medium">Tổng số người dùng</h3>
                                <p className="text-3xl font-bold text-white mt-2">{stats.totalUsers}</p>
                           </div>
                           <div className="bg-[#23233c] p-6 rounded-lg">
                                <h3 className="text-gray-400 text-sm font-medium">Người dùng mới tháng này</h3>
                                <p className="text-3xl font-bold text-white mt-2">{stats.newUsersThisMonth}</p>
                           </div>
                        </div>
                    )}
                    {activeTab === 'transactions' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Giao dịch đang chờ phê duyệt</h2>
                            <div className="overflow-x-auto rounded-lg bg-[#23233c]">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-gray-600 text-xs uppercase text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Người dùng</th>
                                            <th className="px-6 py-3">Nội dung CK</th>
                                            <th className="px-6 py-3">Gói</th>
                                            <th className="px-6 py-3">Số tiền</th>
                                            <th className="px-6 py-3">Ngày tạo</th>
                                            <th className="px-6 py-3">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingTransactions.length === 0 ? (
                                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Không có giao dịch nào đang chờ.</td></tr>
                                        ) : (
                                            pendingTransactions.map((tx) => (
                                                <tr key={tx._id} className="border-b border-gray-700 hover:bg-gray-800">
                                                    <td className="px-6 py-4">{tx.userId?.email || 'N/A'}</td>
                                                    <td className="px-6 py-4 font-mono text-yellow-300">{tx.transactionCode}</td>
                                                    <td className="px-6 py-4">{tx.planId} ({tx.months} tháng)</td>
                                                    <td className="px-6 py-4">{tx.amount.toLocaleString('vi-VN')}đ</td>
                                                    <td className="px-6 py-4">{new Date(tx.createdAt).toLocaleString('vi-VN')}</td>
                                                    <td className="px-6 py-4">
                                                        <button onClick={() => handleApprove(tx._id)} className="rounded bg-green-500 px-3 py-1 font-bold text-white transition hover:bg-green-400">Phê duyệt</button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'users' && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Danh sách tất cả người dùng</h2>
                            <div className="overflow-x-auto rounded-lg bg-[#23233c]">
                                <table className="min-w-full text-left text-sm">
                                     <thead className="border-b border-gray-600 text-xs uppercase text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Email</th>
                                            <th className="px-6 py-3">Gói đang hoạt động</th>
                                            <th className="px-6 py-3">Tổng luồng hiện tại</th>
                                            <th className="px-6 py-3">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allUsers.map((u) => {
                                            const now = new Date();
                                            const activeSubs = (u.subscriptions || []).filter(sub => new Date(sub.expiresAt) > now);
                                            const totalStreams = activeSubs.reduce((total, sub) => total + (PLAN_LIMITS[sub.planId] || 0), 0);
                                            
                                            return (
                                                <tr key={u._id} className="border-b border-gray-700 hover:bg-gray-800">
                                                    <td className="px-6 py-4 font-medium">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setShowUserDetail(true);
                                                            }}
                                                            className="hover:text-violet-400 transition cursor-pointer"
                                                        >
                                                            {u.email}
                                                        </button>
                                                        {u.role === 'admin' && <span className="text-xs text-yellow-400 ml-1">(Admin)</span>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {activeSubs.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {activeSubs.map((sub, i) => (
                                                                    <span key={i} className="inline-block bg-violet-600 text-white text-xs px-2 py-1 rounded">
                                                                        {sub.planId}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">Không có</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-2xl text-green-400">{totalStreams}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(u);
                                                                setShowUserDetail(true);
                                                            }}
                                                            className="text-blue-400 hover:text-blue-300 transition"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
            
            {/* Modal chi tiết user */}
            <UserDetailModal />
        </div>
    );
}