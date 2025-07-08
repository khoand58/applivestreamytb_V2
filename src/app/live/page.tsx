"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Play, Square, Edit, Trash2, Filter } from 'lucide-react';

interface Stream {
  _id: string;
  jobId: string;
  name: string;
  status: 'pending' | 'downloading' | 'streaming' | 'completed' | 'failed' | 'stopped' | 'scheduled';
  createdAt: string;
  scheduledAt?: string;
}

export default function LivePage() {
  const [streamName, setStreamName] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [isLooping, setIsLooping] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [isEndScheduled, setIsEndScheduled] = useState(false);
  const [endTime, setEndTime] = useState('');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterName, setFilterName] = useState('');
  const { user, loading } = useAuth();

  const fetchStreams = async () => {
    if (!user) return;
    try {
      const response = await fetch('http://localhost:4000/api/my-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid }),
      });
      const data = await response.json();
      if (response.ok) {
        // *** THAY ĐỔI: Lấy danh sách stream từ data.streams ***
        setStreams(data.streams);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách stream:", error);
    }
  };

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(fetchStreams, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // Hàm xử lý khi gửi form tạo luồng live mới
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
        alert("Vui lòng đăng nhập để tạo luồng live.");
        return;
    }

    if (!streamKey || !sourceLink) {
      alert("Vui lòng điền đầy đủ Khóa luồng và Link nguồn.");
      return;
    }
    
    const streamData = {
      name: streamName || `Luồng lúc ${new Date().toLocaleTimeString()}`,
      key: streamKey,
      source: sourceLink,
      loop: isLooping,
      isScheduled,
      startTime: isScheduled ? startTime : null,
      isEndScheduled,
      endTime: isEndScheduled ? endTime : null,
      firebaseUid: user.uid,
    };

    try {
      const response = await fetch('http://localhost:4000/api/start-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      
      alert(result.message);
      setStreamName(''); setStreamKey(''); setSourceLink('');
      fetchStreams();
    } catch (error: any) {
      alert(`Có lỗi xảy ra: ${error.message}`);
    }
  };

  // Hàm chung để tạo yêu cầu API có xác thực
  const createApiRequest = async (url: string, method: string, body?: object) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thực hiện hành động này.");
      return;
    }
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, firebaseUid: user.uid }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert(result.message);
      fetchStreams();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  // Các hàm xử lý hành động
  const handleStartNow = (jobId: string) => createApiRequest(`http://localhost:4000/api/streams/${jobId}/start-now`, 'POST');
  const handleStopStream = (jobId: string) => {
    if (confirm('Bạn có chắc chắn muốn dừng luồng live này?')) {
      createApiRequest(`http://localhost:4000/api/streams/${jobId}/stop`, 'POST');
    }
  };
  const handleDeleteStream = (jobId: string) => {
    if (confirm('Hành động này sẽ xóa vĩnh viễn! Bạn có chắc không?')) {
      createApiRequest(`http://localhost:4000/api/streams/${jobId}`, 'DELETE');
    }
  };
  const handleEditStream = (jobId: string, currentName: string) => {
    const newName = prompt("Nhập tên mới cho luồng live:", currentName);
    if (newName && newName.trim() && newName !== currentName) {
      createApiRequest(`http://localhost:4000/api/streams/${jobId}`, 'PUT', { name: newName });
    }
  };

  // Hàm để chọn màu cho badge trạng thái
  const getStatusBadge = (status: Stream['status']) => {
    const statuses = {
      streaming: 'bg-green-500 text-white',
      downloading: 'bg-blue-500 text-white',
      pending: 'bg-yellow-500 text-black',
      scheduled: 'bg-purple-500 text-white',
      completed: 'bg-gray-500 text-white',
      stopped: 'bg-gray-600 text-white',
      failed: 'bg-red-500 text-white',
    };
    return statuses[status] || 'bg-gray-400 text-black';
  };

  // Dùng useMemo để tính toán các giá trị dẫn xuất
  const { statusCounts, filteredStreams } = useMemo(() => {
    const counts: Record<string, number> = {
      streaming: 0, downloading: 0, pending: 0, scheduled: 0,
      completed: 0, stopped: 0, failed: 0,
    };
    
    const filtered: Stream[] = [];

    for (const stream of streams) {
        if (counts.hasOwnProperty(stream.status)) {
            counts[stream.status]++;
        }
        const matchStatus = filterStatus ? stream.status === filterStatus : true;
        const matchName = filterName ? stream.name.toLowerCase().includes(filterName.toLowerCase()) : true;
        if (matchStatus && matchName) {
            filtered.push(stream);
        }
    }
    
    return { statusCounts: counts, filteredStreams: filtered };
  }, [streams, filterStatus, filterName]);


  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Live Youtube/Facebook</h1>
      
      <div className="mb-12 rounded-lg bg-[#23233c] p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-gray-300" htmlFor="streamName">Tên luồng live</label>
            <input className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none" id="streamName" type="text" placeholder="Đặt tên để gợi nhớ" value={streamName} onChange={(e) => setStreamName(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-bold text-gray-300" htmlFor="streamKey">Khóa luồng (Stream Key)</label>
            <textarea className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none" id="streamKey" rows={3} placeholder="Dán khóa luồng từ Youtube, Facebook..." value={streamKey} onChange={(e) => setStreamKey(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="mb-2 block text-sm font-bold text-gray-300" htmlFor="sourceLink">Link nguồn</label>
            <textarea className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none" id="sourceLink" rows={3} placeholder="Dán link video từ Google Drive..." value={sourceLink} onChange={(e) => setSourceLink(e.target.value)} required />
          </div>
          <div className="mb-6">
            <label className="flex items-center text-gray-300">
              <input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-gray-700 text-violet-500 focus:ring-violet-500" checked={isLooping} onChange={(e) => setIsLooping(e.target.checked)} />
              <span className="ml-2">Live vĩnh viễn (Lặp lại video)</span>
            </label>
          </div>
          <div className="mt-6 border-t border-gray-700 pt-6">
            <h3 className="mb-4 font-semibold">Cấu hình thời gian (Tùy chọn)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-gray-700 text-violet-500 focus:ring-violet-500" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} />
                        <span className="ml-2">Đặt lịch bắt đầu</span>
                    </label>
                    {isScheduled && (
                        <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="mt-2 w-full rounded border border-gray-600 bg-gray-700 p-2 text-white" />
                    )}
                </div>
                <div>
                    <label className="flex items-center text-gray-300">
                        <input type="checkbox" className="form-checkbox h-5 w-5 rounded bg-gray-700 text-violet-500 focus:ring-violet-500" checked={isEndScheduled} onChange={e => setIsEndScheduled(e.target.checked)} />
                        <span className="ml-2">Đặt lịch kết thúc</span>
                    </label>
                    {isEndScheduled && (
                        <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-2 w-full rounded border border-gray-600 bg-gray-700 p-2 text-white" />
                    )}
                </div>
            </div>
          </div>
          <div className="mt-8">
            <button className="w-full rounded-lg bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-500" type="submit">Auto Live</button>
          </div>
        </form>
      </div>

      <div className="my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-[#23233c] p-4">
            <span className="font-bold">Tổng số: {streams.length}</span>
            <span className="text-green-400">Đang live: {statusCounts.streaming || 0}</span>
            <span className="text-blue-400">Đang xử lý: {statusCounts.downloading || 0}</span>
            <span className="text-gray-400">Đã dừng: {(statusCounts.stopped || 0) + (statusCounts.completed || 0)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-[#23233c] p-4">
            <input type="text" placeholder="Lọc theo tên..." value={filterName} onChange={e => setFilterName(e.target.value)} className="flex-grow rounded border-gray-600 bg-gray-700 px-3 py-2" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rounded border-gray-600 bg-gray-700 px-3 py-2">
                <option value="">Tất cả trạng thái</option>
                <option value="streaming">Đang live</option>
                <option value="downloading">Đang tải</option>
                <option value="pending">Đang chờ</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="stopped">Đã dừng</option>
                <option value="completed">Hoàn thành</option>
                <option value="failed">Thất bại</option>
            </select>
        </div>
      </div>

      <h2 className="mb-4 text-2xl font-bold">Danh sách luồng đã tạo</h2>
      <div className="overflow-x-auto rounded-lg bg-[#23233c]">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-600 text-xs uppercase text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Tên luồng</th>
              <th scope="col" className="px-6 py-3">Trạng thái</th>
              <th scope="col" className="px-6 py-3">Ngày tạo</th>
              <th scope="col" className="px-6 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredStreams.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400">Không tìm thấy luồng live nào.</td>
              </tr>
            )}
            {filteredStreams.map((stream) => (
              <tr key={stream._id} className="border-b border-gray-700 hover:bg-gray-800">
                <td className="px-6 py-4 font-medium text-white">{stream.name}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusBadge(stream.status)}`}>
                    {stream.status}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(stream.createdAt).toLocaleString('vi-VN')}</td>
                <td className="flex items-center gap-4 px-6 py-4">
                  {stream.status === 'scheduled' && (
                    <button onClick={() => handleStartNow(stream.jobId)} title="Bắt đầu ngay" className="font-medium text-green-500 hover:text-green-400"><Play size={18} /></button>
                  )}
                  {(stream.status === 'streaming' || stream.status === 'downloading') && (
                    <button onClick={() => handleStopStream(stream.jobId)} title="Dừng" className="font-medium text-yellow-500 hover:text-yellow-400"><Square size={18} /></button>
                  )}
                  <button onClick={() => handleEditStream(stream.jobId, stream.name)} title="Sửa tên" className="font-medium text-blue-500 hover:text-blue-400"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteStream(stream.jobId)} title="Xóa" className="font-medium text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
