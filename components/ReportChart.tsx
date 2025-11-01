
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReportChartProps {
  data: any[];
}

const ReportChart: React.FC<ReportChartProps> = ({ data }) => {
  const isDarkMode = document.documentElement.classList.contains('dark');
  const colors = {
    calories: '#f59e0b', // amber-500
    protein: '#3b82f6', // blue-500
    fat: '#ef4444', // red-500
    carbs: '#8b5cf6', // violet-500
    fibre: '#22c55e', // green-500
    axis: isDarkMode ? '#94a3b8' : '#64748b', // slate-400 / slate-500
    grid: isDarkMode ? '#334155' : '#e2e8f0' // slate-700 / slate-200
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg">
          <p className="font-bold text-slate-800 dark:text-slate-200">{`${label}`}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>{`${pld.name}: ${pld.value.toFixed(1)} ${pld.name !== 'Calories' ? 'g' : 'kcal'}`}</p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="name" stroke={colors.axis} tick={{ fontSize: 12 }} />
        <YAxis stroke={colors.axis} tick={{ fontSize: 12 }}/>
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{fontSize: "12px"}}/>
        {data[0]?.name === "Today" || data[0]?.name === "Month" ? null : <Bar dataKey="calories" name="Calories (kcal)" fill={colors.calories} />}
        <Bar dataKey="protein" name="Protein (g)" fill={colors.protein} />
        <Bar dataKey="fat" name="Fat (g)" fill={colors.fat} />
        <Bar dataKey="carbs" name="Carbs (g)" fill={colors.carbs} />
        <Bar dataKey="fibre" name="Fibre (g)" fill={colors.fibre} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ReportChart;
