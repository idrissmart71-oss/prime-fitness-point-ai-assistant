
import React, { useState, useMemo } from 'react';

const BMICalculator: React.FC = () => {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const { bmi, category, color, calorieGoal } = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);

    if (h > 0 && w > 0) {
      const heightInMeters = h / 100;
      const bmiValue = w / (heightInMeters * heightInMeters);

      let cat = '';
      let col = '';
      if (bmiValue < 18.5) {
        cat = 'Underweight';
        col = 'text-blue-500';
      } else if (bmiValue < 24.9) {
        cat = 'Normal weight';
        col = 'text-green-500';
      } else if (bmiValue < 29.9) {
        cat = 'Overweight';
        col = 'text-yellow-500';
      } else {
        cat = 'Obesity';
        col = 'text-red-500';
      }

      // Simplified Mifflin-St Jeor Equation for BMR (assuming 30yo male, moderately active)
      // This is a rough estimate. A real app would need more inputs (age, sex, activity level).
      const bmr = 10 * w + 6.25 * h - 5 * 30 + 5;
      const goal = bmr * 1.55; // Moderately active

      return { bmi: bmiValue.toFixed(1), category: cat, color: col, calorieGoal: goal.toFixed(0) };
    }
    return { bmi: null, category: null, color: '', calorieGoal: null };
  }, [height, weight]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4">BMI & Calorie Goal</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Weight (kg)</label>
          <input
            type="number"
            id="weight"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g., 70"
            className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          />
        </div>
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="e.g., 175"
            className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          />
        </div>
      </div>
      {bmi && (
        <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Your BMI</p>
          <p className={`text-4xl font-bold ${color}`}>{bmi}</p>
          <p className={`text-sm font-semibold ${color}`}>{category}</p>
          <hr className="my-3 border-slate-200 dark:border-slate-600"/>
           <p className="text-sm text-slate-500 dark:text-slate-400">Suggested Daily Goal</p>
           <p className="text-2xl font-bold text-primary-500">{calorieGoal} <span className="text-base font-normal">kcal</span></p>
           <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This is an estimate for a moderately active person.</p>
        </div>
      )}
    </div>
  );
};

export default BMICalculator;
