import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'danger';
}

const variantStyles = {
  default: { card: 'bg-gray-50', icon: 'text-[#1A1F36]' },
  success: { card: 'bg-[#F0FDF4]', icon: 'text-green-600' },
  danger: { card: 'bg-[#FEF2F2]', icon: 'text-red-600' },
};

export default function StatCard({ icon, label, value, variant = 'default' }: StatCardProps) {
  const s = variantStyles[variant];
  return (
    <div className={`${s.card} rounded-xl p-4 flex items-center gap-3`}>
      <div className={`${s.icon} flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
        <p className="text-2xl font-bold text-[#1A1F36] leading-tight">{value}</p>
      </div>
    </div>
  );
}
