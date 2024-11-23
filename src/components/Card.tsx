import { ReactNode } from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend: string;
}

function Card({ title, value, icon, trend }: CardProps) {
  return (
    <div className="glass-card rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-portal-purple/10 flex items-center justify-center text-portal-purple text-lg md:text-xl">
          {icon}
        </div>
        <span className="text-xs md:text-sm font-medium text-green-500">{trend}</span>
      </div>
      <h3 className="text-gray-600 text-xs md:text-sm mb-1">{title}</h3>
      <p className="text-xl md:text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}

export default Card;