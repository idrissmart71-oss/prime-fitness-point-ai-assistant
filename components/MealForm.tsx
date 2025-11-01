
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Dish, MealEntry } from '../types';
import { PlusCircleIcon } from './icons';

interface MealFormProps {
  dishes: Dish[];
  onAddMeal: (meal: Omit<MealEntry, 'id' | 'date'>) => void;
}

const MealForm: React.FC<MealFormProps> = ({ dishes, onAddMeal }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'>('Breakfast');
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!inputValue) return [];
    // Show all if input is there but no selection yet
    if (!selectedDish) {
        return dishes
            .filter(dish => dish.name.toLowerCase().includes(inputValue.toLowerCase()))
            .slice(0, 7); // Limit suggestions for performance
    }
    return [];
  }, [dishes, inputValue, selectedDish]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if(selectedDish && selectedDish.name !== value) {
        setSelectedDish(null); // Deselect if user types again
    }
    setError('');
    setShowSuggestions(true);
  };
  
  const handleSuggestionClick = (dish: Dish) => {
    setInputValue(dish.name);
    setSelectedDish(dish);
    setShowSuggestions(false);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDish) {
      setError('Please select a valid dish from the suggestions list.');
      return;
    }
    if (quantity > 0) {
      onAddMeal({ dish: selectedDish, quantity, mealType });
      setInputValue('');
      setSelectedDish(null);
      setQuantity(1);
      setError('');
    } else {
        setError('Invalid quantity. Must be greater than 0.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6" ref={componentRef}>
      <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4">Log a Meal</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
            <label htmlFor="dish-search" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Dish
            </label>
            <input
                id="dish-search"
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => {
                    if(!selectedDish) setShowSuggestions(true);
                }}
                placeholder="Type to search for a dish..."
                autoComplete="off"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map(dish => (
                        <li
                            key={dish.name}
                            onMouseDown={() => handleSuggestionClick(dish)}
                            className="cursor-pointer p-3 text-sm text-slate-800 dark:text-slate-200 hover:bg-primary-100 dark:hover:bg-slate-600"
                        >
                            <span className="font-semibold">{dish.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400"> ({dish.calories} kcal)</span>
                        </li>
                    ))}
                </ul>
            )}
             {showSuggestions && inputValue && suggestions.length === 0 && (
                <div className="absolute z-10 w-full mt-1 p-3 text-sm text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg">
                    No dishes found. Try a different search term or adjust filters.
                </div>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Quantity (Servings)
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0.1"
                step="0.1"
                className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              />
            </div>
            <div>
              <label htmlFor="mealType" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Meal Type
              </label>
              <select
                id="mealType"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option>Breakfast</option>
                <option>Lunch</option>
                <option>Dinner</option>
                <option>Snacks</option>
              </select>
            </div>
        </div>
        
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        
        <button
          type="submit"
          disabled={!selectedDish}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
        >
          <PlusCircleIcon />
          Add Meal
        </button>
      </form>
    </div>
  );
};

export default MealForm;
