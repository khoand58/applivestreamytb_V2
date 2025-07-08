"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// Dữ liệu gói cước
const pricingPlans = [
  { name: 'LIVE1', price: '150.000', originalPrice: '200.000', features: ['Live cùng lúc 1 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE3', price: '410.000', originalPrice: '550.000', features: ['Live cùng lúc 3 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE5', price: '680.000', originalPrice: '900.000', features: ['Live cùng lúc 5 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE10', price: '1.350.000', originalPrice: '1.800.000', features: ['Live cùng lúc 10 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE20', price: '2.630.000', originalPrice: '3.500.000', features: ['Live cùng lúc 20 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE30', price: '3.900.000', originalPrice: '5.200.000', features: ['Live cùng lúc 30 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE50', price: '6.000.000', originalPrice: '8.000.000', features: ['Live cùng lúc 50 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE100', price: '11.000.000', originalPrice: '15.000.000', features: ['Live cùng lúc 100 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE150', price: '16.000.000', originalPrice: '21.000.000', features: ['Live cùng lúc 150 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
  { name: 'LIVE200', price: '20.000.000', originalPrice: '28.000.000', features: ['Live cùng lúc 200 luồng', 'Live Youtube liên tục 24/7', 'Không cần Treo máy', 'Chất lượng 1080p Full HD', 'Hỗ trợ 24/7'] },
];

const PricingCard = ({ plan, onPurchase }: { plan: typeof pricingPlans[0], onPurchase: (plan: typeof pricingPlans[0]) => void }) => (
  <div className="flex flex-col rounded-lg p-6 text-center shadow-lg bg-[#23233c]">
    <h3 className="text-2xl font-bold text-violet-400">{plan.name}</h3>
    <div className="my-4">
      {plan.originalPrice && <span className="text-xl text-gray-400 line-through">{plan.originalPrice}</span>}
      <p className="text-4xl font-extrabold text-white">{plan.price}</p>
      <p className="text-gray-400">/ tháng</p>
    </div>
    <ul className="mb-6 flex-grow space-y-2 text-left text-sm">
      {plan.features.map((feature) => (
        <li key={feature} className="flex items-center">
          <svg className="mr-2 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <button onClick={() => onPurchase(plan)} className="mt-auto w-full rounded-full bg-yellow-500 py-3 font-bold text-black transition hover:bg-yellow-400">
      Mua Ngay
    </button>
  </div>
);

export default function PricingPage() {
  const { user, appUser } = useAuth();
  const router = useRouter();

  const handlePurchase = (plan: typeof pricingPlans[0]) => {
    if (!user) {
        alert("Vui lòng đăng nhập để mua gói.");
        router.push('/login');
        return;
    }

    // SỬA LỖI: Kiểm tra chính xác xem có gói nào còn hạn không
    const hasActivePlan = appUser?.subscriptions?.some(sub => new Date(sub.expiresAt) > new Date());

    if (hasActivePlan) {
        if (confirm(`Bạn đang có gói dịch vụ đang hoạt động. Bạn có muốn mua thêm gói ${plan.name} để gộp chung và tăng số luồng live không?`)) {
            router.push(`/checkout/${plan.name}?price=${plan.price}`);
        }
    } else {
        router.push(`/checkout/${plan.name}?price=${plan.price}`);
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-center text-4xl font-bold">Dịch vụ Live Youtube/Facebook</h1>
      <p className="mb-12 text-center text-gray-400">
        Giải pháp livestream chuyên nghiệp với nhiều lựa chọn phù hợp với mọi nhu cầu
      </p>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} onPurchase={handlePurchase} />
        ))}
      </div>
    </div>
  );
}
