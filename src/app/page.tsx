"use client";

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { ArrowRight, Clapperboard, DollarSign, Clock, Zap, Package } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

// Dữ liệu giới hạn luồng của các gói
const PLAN_LIMITS: Record<string, number> = {
    'TRIAL': 1, 'LIVE1': 1, 'LIVE3': 3, 'LIVE5': 5, 'LIVE10': 10, 'LIVE20': 20,
    'LIVE30': 30, 'LIVE50': 50, 'LIVE100': 100, 'LIVE150': 150, 'LIVE200': 200,
    'FREE': 0
};

// Hàm tiện ích để tính toán thời gian còn lại
function getTimeRemaining(endtime: string) {
  const total = Date.parse(endtime) - Date.now();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  
  return {
    total,
    days,
    hours,
    minutes,
    seconds
  };
}

export default function HomePage() {
  const { user, appUser, loading } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [activeStreamsCount, setActiveStreamsCount] = useState(0);

  const { totalMaxStreams, trialSubscription, activePlanNames } = useMemo(() => {
    if (!appUser) return { totalMaxStreams: 0, trialSubscription: null, activePlanNames: [] };
    const activeSubs = appUser.subscriptions.filter(sub => new Date(sub.expiresAt) > new Date());
    const maxStreams = activeSubs.reduce((total, sub) => total + (PLAN_LIMITS[sub.planId] || 0), 0);
    const trialSub = activeSubs.find(sub => sub.planId === 'TRIAL');
    const planNames = activeSubs.map(sub => sub.planId);
    return { totalMaxStreams: maxStreams, trialSubscription: trialSub, activePlanNames: planNames };
  }, [appUser]);

  // *** THAY ĐỔI: useEffect để lấy số luồng đang hoạt động ***
  useEffect(() => {
    if (user?.uid) {
      const fetchActiveCount = async () => {
        try {
          // Gọi API /api/my-streams bằng phương thức POST
          const response = await fetch(`http://localhost:4000/api/my-streams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firebaseUid: user.uid })
          });
          const data = await response.json();
          if (response.ok) {
            // Lấy activeCount từ response mới
            setActiveStreamsCount(data.activeCount);
          }
        } catch (error) {
          console.error("Lỗi khi lấy số luồng đang hoạt động:", error);
        }
      };
      
      fetchActiveCount();
      const intervalId = setInterval(fetchActiveCount, 5000); // Cập nhật mỗi 5 giây
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // useEffect cho đồng hồ đếm ngược giữ nguyên
  useEffect(() => {
    if (trialSubscription) {
      const interval = setInterval(() => {
        const remaining = getTimeRemaining(trialSubscription.expiresAt);
        if (remaining.total <= 0) {
          clearInterval(interval);
          setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
        } else {
          setTimeRemaining({ days: remaining.days, hours: remaining.hours, minutes: remaining.minutes });
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [trialSubscription]);

  if (loading) {
    return <div className="text-center p-10">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Banner chào mừng */}
      <div className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-500 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold">Chào mừng trở lại, {user?.email?.split('@')[0] || 'bạn'}!</h1>
        <p className="mt-2 text-lg text-violet-200">Sẵn sàng để bắt đầu một buổi livestream tuyệt vời?</p>
      </div>

      {/* Banner đếm ngược thời gian dùng thử */}
      {trialSubscription && (timeRemaining.days > 0 || timeRemaining.hours > 0 || timeRemaining.minutes > 0) && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-300">Gói dùng thử của bạn sắp hết hạn!</h3>
              <p className="text-sm text-yellow-400">
                Còn lại: <span className="font-bold">{timeRemaining.days}</span> ngày <span className="font-bold">{timeRemaining.hours}</span> giờ <span className="font-bold">{timeRemaining.minutes}</span> phút
              </p>
            </div>
          </div>
          <Link href="/pricing" className="flex-shrink-0 rounded-full bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-400">
            Nâng cấp ngay
          </Link>
        </div>
      )}

      {/* Các thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-[#23233c] p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-400 flex items-center"><Package size={20} className="mr-2"/> Gói đang sử dụng</h2>
            <div className="mt-2">
              {activePlanNames.length > 0 ? (
                <p className="text-md text-violet-400 font-bold break-words">
                  {activePlanNames.join(', ')}
                </p>
              ) : (
                <p className="text-md text-gray-500">Không có gói nào</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Tổng số luồng của bạn:</p>
            <p className="text-5xl font-bold text-green-400">{totalMaxStreams}</p>
          </div>
        </div>

        {/* THAY ĐỔI: Hiển thị số luồng đang hoạt động từ state */}
        <div className="rounded-lg bg-[#23233c] p-6">
          <h2 className="text-xl font-semibold text-gray-400">Luồng đang hoạt động</h2>
          <p className="mt-2 text-4xl font-bold text-violet-400">{activeStreamsCount}</p>
          <p className="text-sm text-gray-500">Số luồng đang chạy ở thời điểm hiện tại.</p>
        </div>
        
        <div className="rounded-lg bg-[#23233c] p-6">
          <h2 className="text-xl font-semibold text-gray-400">Trạng thái hệ thống</h2>
          <div className="mt-2 flex items-center gap-2">
            <Zap size={24} className="text-green-500" />
            <p className="text-lg font-bold text-green-400">Hoạt động ổn định</p>
          </div>
           <p className="text-sm text-gray-500">Tất cả dịch vụ đang chạy bình thường.</p>
        </div>
      </div>

      {/* Các lối tắt nhanh */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Lối tắt nhanh</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/live" className="group flex items-center justify-between rounded-lg bg-[#23233c] p-6 transition hover:bg-violet-500">
            <div>
              <Clapperboard className="mb-2 h-8 w-8 text-violet-400" />
              <h3 className="text-lg font-semibold">Tạo & Quản lý Live</h3>
              <p className="text-sm text-gray-400">Bắt đầu luồng live mới hoặc quản lý các luồng hiện có.</p>
            </div>
            <ArrowRight className="h-6 w-6 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
          </Link>
          <Link href="/pricing" className="group flex items-center justify-between rounded-lg bg-[#23233c] p-6 transition hover:bg-yellow-500">
            <div>
              <DollarSign className="mb-2 h-8 w-8 text-yellow-400" />
              <h3 className="text-lg font-semibold">Mua thêm gói</h3>
              <p className="text-sm text-gray-400">Nâng cấp hoặc mua thêm gói để tăng số luồng live.</p>
            </div>
            <ArrowRight className="h-6 w-6 text-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-black" />
          </Link>
        </div>
      </div>
    </div>
  );
}
