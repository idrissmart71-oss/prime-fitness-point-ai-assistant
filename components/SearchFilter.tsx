
import React, { useState, useEffect } from 'react';
import { SearchIcon, FilterIcon } from './icons';

interface SearchFilterProps {
  onSearch: (term: string) => void;
  onFilter: (range: { min: number; max: number }) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({ onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [minCalories, setMinCalories] = useState('');
  const [maxCalories, setMaxCalories] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, onSearch]);

  useEffect(() => {
    const min = minCalories ? parseInt(minCalories, 10) : 0;
    const max = maxCalories ? parseInt(maxCalories, 10) : 2000;
    if (!isNaN(min) && !isNaN(max)) {
      onFilter({ min, max });
    }
  }, [minCalories, maxCalories, onFilter]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Search Dish
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g., Paneer Butter Masala"
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
         <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Filter by Calorie Range
        </label>
        <div className="flex items-center gap-2">
           <input
            type="number"
            value={minCalories}
            onChange={(e) => setMinCalories(e.target.value)}
            placeholder="Min"
            className="block w-full py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            <span className="text-slate-500 dark:text-slate-400">-</span>
           <input
            type="number"
            value={maxCalories}
            onChange={(e) => setMaxCalories(e.target.value)}
            placeholder="Max"
            className="block w-full py-2 px-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;
