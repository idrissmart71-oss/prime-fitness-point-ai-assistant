
import React from 'react';
import type { NutritionData } from '../types';

interface SummaryCardProps {
  totals: NutritionData;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ totals }) => {
  const nutrientItems = [
    { label: 'Protein', value: totals.protein, unit: 'g', color: 'bg-blue-500' },
    { label: 'Fat', value: totals.fat, unit: 'g', color: 'bg-red-500' },
    { label: 'Carbs', value: totals.carbs, unit: 'g', color: 'bg-violet-500' },
    { label: 'Fibre', value: totals.fibre, unit: 'g', color: 'bg-green-500' },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 h-full flex flex-col justify-center">
      <div className="text-center mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Total Calories</p>
        <p className="text-4xl font-bold text-amber-500">{totals.calories.toFixed(0)}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">kcal</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {nutrientItems.map(item => (
          <div key={item.label} className="text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
              {item.label}
            </p>
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              {item.value.toFixed(1)} <span className="text-xs">{item.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryCard;
