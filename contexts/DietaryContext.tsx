import React, { createContext, useContext, useState, useEffect } from 'react';
import { DietaryService } from '@/services/dietaryService';
import { useAuth } from './AuthContext';

export interface DietaryPref {
  $id: string;
  name: string;
}

export const DIETARY_PREFERENCES: DietaryPref[] = [
  { $id: 'mediterranean', name: 'Mediterranean' },
  { $id: 'low-sodium', name: 'Low Sodium' },
  { $id: 'keto', name: 'Keto' },
  { $id: 'diabetic', name: 'Diabetic' },
  { $id: 'vegan', name: 'Vegan' },
  { $id: 'vegetarian', name: 'Vegetarian' },
  { $id: 'whole-30', name: 'Whole 30' },
  { $id: 'paleo', name: 'Paleo' },
];

interface DietaryContextType {
  userDietaryPrefs: DietaryPref[];
  selectedDiet: DietaryPref[];
  loading: boolean;
  applySelectedDiet: (prefs: DietaryPref[]) => Promise<void>;
  toggleDietaryPref: (pref: DietaryPref) => Promise<void>;
}

const DietaryContext = createContext<DietaryContextType | undefined>(undefined);

export function DietaryProvider({ children }: { children: React.ReactNode }) {
  const [userDietaryPrefs, setUserDietaryPrefs] = useState<DietaryPref[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<DietaryPref[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchDietaryPrefs = async () => {
    if (!user) return;

    try {
      const prefNames = await DietaryService.getUserDietaryPrefs(user.id);
      const prefObjects = DIETARY_PREFERENCES.filter((pref) =>
        prefNames.includes(pref.name)
      );

      setUserDietaryPrefs(prefObjects);
      setSelectedDiet(prefObjects);
    } catch (error) {
      console.error('Error fetching dietary preferences:', error);
      setUserDietaryPrefs([]);
      setSelectedDiet([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDietaryPrefs();
    } else {
      setUserDietaryPrefs([]);
      setSelectedDiet([]);
    }
  }, [user]);

  const applySelectedDiet = async (prefs: DietaryPref[]) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      // Update local state immediately for better UX
      setSelectedDiet(prefs);
      setUserDietaryPrefs(prefs);

      await DietaryService.setUserDietaryPrefs(user.id, prefs);
    } catch (error) {
      console.error('Error updating dietary preferences:', error);
      // Revert optimistic update by refetching
      await fetchDietaryPrefs();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleDietaryPref = async (pref: DietaryPref) => {
    if (!user || loading) return;

    const isCurrentlySelected = selectedDiet.some((p) => p.$id === pref.$id);
    const updatedPrefs = isCurrentlySelected
      ? selectedDiet.filter((p) => p.$id !== pref.$id)
      : [...selectedDiet, pref];

    await applySelectedDiet(updatedPrefs);
  };

  return (
    <DietaryContext.Provider
      value={{
        userDietaryPrefs,
        selectedDiet,
        loading,
        applySelectedDiet,
        toggleDietaryPref,
      }}
    >
      {children}
    </DietaryContext.Provider>
  );
}

export function useDietary() {
  const context = useContext(DietaryContext);
  if (context === undefined) {
    throw new Error('useDietary must be used within a DietaryProvider');
  }
  return context;
}
