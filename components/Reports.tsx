
import React, { useState, useMemo } from 'react';
import type { MealEntry, NutritionData } from '../types';
import ReportChart from './ReportChart';
import SummaryCard from './SummaryCard';

interface ReportsProps {
  mealEntries: MealEntry[];
}

const calculateTotals = (meals: MealEntry[]): NutritionData => {
  return meals.reduce((acc, entry) => {
    acc.calories += entry.dish.calories * entry.quantity;
    acc.protein += entry.dish.protein * entry.quantity;
    acc.fat += entry.dish.fat * entry.quantity;
    acc.carbs += entry.dish.carbs * entry.quantity;
    acc.fibre += entry.dish.fibre * entry.quantity;
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0, fibre: 0 });
};

const Reports: React.FC<ReportsProps> = ({ mealEntries }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'mealwise'>('daily');

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const dailyData = useMemo(() => {
    const dailyMeals = mealEntries.filter(m => m.date.startsWith(today));
    return calculateTotals(dailyMeals);
  }, [mealEntries, today]);
  
  const monthlyData = useMemo(() => {
    const monthlyMeals = mealEntries.filter(m => {
        const mealDate = new Date(m.date);
        return mealDate.getMonth() === currentMonth && mealDate.getFullYear() === currentYear;
    });
    return calculateTotals(monthlyMeals);
  }, [mealEntries, currentMonth, currentYear]);

  const mealwiseData = useMemo(() => {
    const data = {
      Breakfast: calculateTotals(mealEntries.filter(m => m.mealType === 'Breakfast')),
      Lunch: calculateTotals(mealEntries.filter(m => m.mealType === 'Lunch')),
      Dinner: calculateTotals(mealEntries.filter(m => m.mealType === 'Dinner')),
      Snacks: calculateTotals(mealEntries.filter(m => m.mealType === 'Snacks')),
    };
    return Object.keys(data).map(key => ({ name: key, ...data[key as keyof typeof data] }));
  }, [mealEntries]);
  
  const renderReport = () => {
    switch (activeTab) {
      case 'daily':
        return <ReportContent title="Today's Report" data={dailyData} chartData={[{ name: 'Today', ...dailyData }]} />;
      case 'monthly':
        return <ReportContent title="This Month's Report" data={monthlyData} chartData={[{ name: 'Month', ...monthlyData }]} />;
      case 'mealwise':
        const total = calculateTotals(mealEntries);
        return <ReportContent title="Meal-wise Report" data={total} chartData={mealwiseData} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{tab: 'daily' | 'monthly' | 'mealwise', label: string}> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab 
          ? 'bg-primary-600 text-white' 
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Reports</h2>
        <div className="flex space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          <TabButton tab="daily" label="Daily" />
          <TabButton tab="monthly" label="Monthly" />
          <TabButton tab="mealwise" label="Meal-wise" />
        </div>
      </div>
      {renderReport()}
    </div>
  );
};

const ReportContent: React.FC<{ title: string; data: NutritionData; chartData: any[] }> = ({ title, data, chartData }) => (
  <div>
    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-64">
        <ReportChart data={chartData} />
      </div>
      <div>
        <SummaryCard totals={data} />
      </div>
    </div>
  </div>
);

export default Reports;
