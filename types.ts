
export interface Message {
  role: 'user' | 'model';
  content: string;
}

// Fix: Add NutritionData interface for tracking nutritional values.
export interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fibre: number;
}

// Fix: Add Dish interface which extends NutritionData with a name.
export interface Dish extends NutritionData {
  name: string;
}

// Fix: Add MealEntry interface for logging meals.
export interface MealEntry {
  id: string;
  date: string;
  dish: Dish;
  quantity: number;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
}
