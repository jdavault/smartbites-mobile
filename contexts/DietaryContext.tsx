import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface DietaryPref {
  $id: string;
  name: string;
}

export const DIETARY_PREFERENCES: DietaryPref[] = [
  { $id: 'vegan', name: 'Vegan' },
  { $id: 'vegetarian', name: 'Vegetarian' },
  { $id: 'gluten-free', name: 'Gluten-Free' },
  { $id: 'dairy-free', name: 'Dairy-Free' },
  { $id: 'keto', name: 'Keto' },
  { $id: 'paleo', name: 'Paleo' },
  { $id: 'low-carb', name: 'Low-Carb' },
  { $id: 'high-protein', name: 'High-Protein' },
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
      const { data, error } = await supabase
        .from('user_dietary_prefs')
        .select('dietary_pref')
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          setUserDietaryPrefs([]);
          setSelectedDiet([]);
          return;
        }
        throw error;
      }

      const prefNames = data?.map(item => item.dietary_pref) || [];
      const prefObjects = DIETARY_PREFERENCES.filter(pref => 
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

      // Remove all existing preferences
      await supabase
        .from('user_dietary_prefs')
        .delete()
        .eq('user_id', user.id);

      // Add new preferences
      if (prefs.length > 0) {
        const prefsData = prefs.map(pref => ({
          user_id: user.id,
          dietary_pref: pref.name,
        }));

        const { error } = await supabase
          .from('user_dietary_prefs')
          .insert(prefsData);

        if (error) throw error;
      }
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
    
    const isCurrentlySelected = selectedDiet.some(p => p.$id === pref.$id);
    const updatedPrefs = isCurrentlySelected
      ? selectedDiet.filter(p => p.$id !== pref.$id)
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