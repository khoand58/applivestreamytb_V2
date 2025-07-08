import { Check } from 'lucide-react';

type PricingCardProps = {
  plan: {
    name: string;
    originalPrice: string;
    price: string;
    features: string[];
  };
};

export default function PricingCard({ plan }: PricingCardProps) {
  return (
    <div className="flex flex-col rounded-lg bg-[#23233c] p-6 text-center shadow-lg">
      <h3 className="text-2xl font-bold text-violet-400">{plan.name}</h3>
      <div className="my-4">
        <span className="text-xl text-gray-400 line-through">{plan.originalPrice}</span>
        <p className="text-4xl font-extrabold text-white">{plan.price}</p>
        <p className="text-gray-400">/ tháng</p>
      </div>
      <ul className="mb-6 flex-grow space-y-2 text-left">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center">
            <Check className="mr-2 h-5 w-5 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button className="mt-auto w-full rounded-full bg-yellow-500 py-3 font-bold text-black transition hover:bg-yellow-400">
        Mua Ngay
      </button>
    </div>
  );
}