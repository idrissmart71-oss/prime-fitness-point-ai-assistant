
import React from 'react';
import type { MealEntry } from '../types';
import { TrashIcon, DownloadIcon } from './icons';

interface MealTableProps {
  meals: MealEntry[];
  onDeleteMeal: (id: string) => void;
}

const MealTable: React.FC<MealTableProps> = ({ meals, onDeleteMeal }) => {

  const exportToCSV = () => {
    const headers = ['Date', 'Meal', 'Dish', 'Quantity', 'Calories', 'Protein (g)', 'Fat (g)', 'Carbs (g)', 'Fibre (g)'];
    const rows = meals.map(meal => [
      new Date(meal.date).toLocaleDateString(),
      meal.mealType,
      meal.dish.name,
      meal.quantity,
      (meal.dish.calories * meal.quantity).toFixed(1),
      (meal.dish.protein * meal.quantity).toFixed(1),
      (meal.dish.fat * meal.quantity).toFixed(1),
      (meal.dish.carbs * meal.quantity).toFixed(1),
      (meal.dish.fibre * meal.quantity).toFixed(1),
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "healthify_meal_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="overflow-x-auto">
      {meals.length === 0 ? (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p>No meals logged yet. Add a meal to get started!</p>
        </div>
      ) : (
        <>
        <button
          onClick={exportToCSV}
          className="mb-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/50 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <DownloadIcon />
          Export as CSV
        </button>
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              {['Date', 'Meal', 'Dish', 'Nutrition (per serving)', 'Action'].map(header => (
                 <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {meals.slice().reverse().map(meal => {
              const total = {
                calories: (meal.dish.calories * meal.quantity).toFixed(1),
                protein: (meal.dish.protein * meal.quantity).toFixed(1),
                fat: (meal.dish.fat * meal.quantity).toFixed(1),
                carbs: (meal.dish.carbs * meal.quantity).toFixed(1),
                fibre: (meal.dish.fibre * meal.quantity).toFixed(1),
              };
              return (
                <tr key={meal.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(meal.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{meal.mealType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                    {meal.quantity} x {meal.dish.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    <div><span className="font-semibold">{total.calories}</span> kcal</div>
                    <div className="text-xs">P: {total.protein}g, F: {total.fat}g, C: {total.carbs}g, Fb: {total.fibre}g</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onDeleteMeal(meal.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </>
      )}
    </div>
  );
};

export default MealTable;
