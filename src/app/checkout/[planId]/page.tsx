"use client";
import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Hàm tạo link VietQR
const generateVietQRLink = (price: number, planId: string, userEmail: string, months: number) => {
    const bankId = "970436"; // Vietcombank
    const accountNumber = "3456899999"; // STK của bạn
    const amount = Math.round(price);
    const description = `${userEmail.split('@')[0]}${planId}${months}T`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    return `https://img.vietqr.io/image/${bankId}-${accountNumber}-${amount}-compact.png?addInfo=${description}`;
};

// Các tùy chọn thời hạn và chiết khấu
const durationOptions = [
  { months: 1, discount: 0, label: "Mua 1 Tháng" },
  { months: 3, discount: 0.10, label: "Mua 3 Tháng" },
  { months: 6, discount: 0.16, label: "Mua 6 Tháng" },
  { months: 12, discount: 0.20, label: "Mua 12 Tháng" },
];

export default function CheckoutPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { user, loading } = useAuth(); // Lấy đúng biến 'user'
    const router = useRouter();

    const [selectedMonths, setSelectedMonths] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const planId = params.planId as string;
    const basePrice = parseInt(searchParams.get('price')?.replace(/\./g, '') || '0', 10);

    const { totalPrice, discountAmount, finalPrice } = useMemo(() => {
        const selectedOption = durationOptions.find(opt => opt.months === selectedMonths) || durationOptions[0];
        const total = basePrice * selectedMonths;
        const discount = total * selectedOption.discount;
        const final = total - discount;
        return {
            totalPrice: total,
            discountAmount: discount,
            finalPrice: final,
        };
    }, [basePrice, selectedMonths]);

    const handleConfirmPayment = async () => {
        if (!user) {
            alert("Lỗi xác thực, vui lòng đăng nhập lại.");
            return;
        }
        setIsSubmitting(true);
        
        const qrDescription = `${user.email!.split('@')[0]}${planId}${selectedMonths}T`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        
        const transactionData = {
            firebaseUid: user.uid, // Dùng user.uid
            planId,
            months: selectedMonths,
            amount: finalPrice,
            transactionCode: qrDescription,
        };

        try {
            const response = await fetch('http://localhost:4000/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            alert(result.message);
            router.push('/profile');
        } catch (error: any) {
            alert(`Lỗi: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <p className="p-8 text-center">Đang tải...</p>;
    }
    
    if (!user) {
        return <p className="p-8 text-center">Vui lòng đăng nhập để thực hiện thanh toán.</p>;
    }

    const qrLink = generateVietQRLink(finalPrice, planId, user.email!, selectedMonths);
    const qrDescription = `${user.email!.split('@')[0]}${planId}${selectedMonths}T`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-lg bg-[#23233c] p-8 shadow-lg">
                <h1 className="text-3xl font-bold mb-6 text-center">Hóa Đơn</h1>
                
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {durationOptions.map(opt => (
                        <button 
                            key={opt.months} 
                            onClick={() => setSelectedMonths(opt.months)}
                            className={`rounded-lg p-3 text-center transition ${selectedMonths === opt.months ? 'bg-violet-600 ring-2 ring-violet-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            <p className="font-bold">{opt.label}</p>
                            {opt.discount > 0 && <p className="text-xs text-yellow-400">Tiết kiệm ~{Math.round(opt.discount * 100)}%</p>}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="min-w-full text-left text-sm">
                        <tbody>
                            <tr className="border-b border-gray-700"><td className="px-4 py-3 text-gray-400">Sản phẩm</td><td className="px-4 py-3 text-right font-medium">Gói {planId}</td></tr>
                            <tr className="border-b border-gray-700"><td className="px-4 py-3 text-gray-400">Số tháng</td><td className="px-4 py-3 text-right font-medium">{selectedMonths}</td></tr>
                            <tr className="border-b border-gray-700"><td className="px-4 py-3 text-gray-400">Tạm tính</td><td className="px-4 py-3 text-right font-medium">{totalPrice.toLocaleString('vi-VN')} VNĐ</td></tr>
                            <tr className="border-b border-gray-700"><td className="px-4 py-3 text-gray-400">Giảm giá</td><td className="px-4 py-3 text-right font-medium text-green-400">- {discountAmount.toLocaleString('vi-VN')} VNĐ</td></tr>
                            <tr className="text-lg"><td className="px-4 py-3 font-bold">Tổng cộng</td><td className="px-4 py-3 text-right font-bold text-violet-400">{finalPrice.toLocaleString('vi-VN')} VNĐ</td></tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-8 text-center">
                    <p className="mb-2 text-sm">Quét mã QR để thanh toán qua ứng dụng ngân hàng</p>
                    <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-lg bg-white p-2">
                        <Image src={qrLink} alt="VietQR Code" width={250} height={250} unoptimized />
                    </div>
                    <div className="mt-4 rounded-lg bg-gray-700 p-2 text-left text-sm">
                        <p><strong>Nội dung chuyển khoản:</strong> <span className="font-mono text-yellow-300">{qrDescription}</span></p>
                    </div>
                </div>
                 <button 
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting}
                    className="mt-8 w-full rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-500"
                 >
                    {isSubmitting ? 'Đang xử lý...' : 'Tôi đã chuyển khoản'}
                </button>
            </div>
        </div>
    );
}
