import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Allergen {
  $id: string;
  name: string;
}

export const ALLERGENS: Allergen[] = [
  { $id: 'milk', name: 'Milk' },
  { $id: 'eggs', name: 'Eggs' },
  { $id: 'fish', name: 'Fish' },
  { $id: 'shellfish', name: 'Shellfish' },
  { $id: 'tree-nuts', name: 'Tree Nuts' },
  { $id: 'peanuts', name: 'Peanuts' },
  { $id: 'wheat-gluten', name: 'Wheat (Gluten)' },
  { $id: 'soybeans', name: 'Soybeans' },
  { $id: 'sesame', name: 'Sesame' },
];

interface AllergensContextType {
  userAllergens: Allergen[];
  selectedAllergens: Allergen[];
  loading: boolean;
  applySelectedAllergens: (allergens: Allergen[]) => Promise<void>;
  toggleAllergen: (allergen: Allergen) => Promise<void>;
}

const AllergensContext = createContext<AllergensContextType | undefined>(undefined);

export function AllergensProvider({ children }: { children: React.ReactNode }) {
  const [userAllergens, setUserAllergens] = useState<Allergen[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<Allergen[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchAllergens = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_allergens')
        .select('allergen')
        .eq('user_id', user.id);

      if (error) {
        if (error.code === '42P01') {
          console.warn('Database tables not created yet. Please run the migration.');
          setUserAllergens([]);
          setSelectedAllergens([]);
          return;
        }
        throw error;
      }

      const allergenNames = data?.map(item => item.allergen) || [];
      const allergenObjects = ALLERGENS.filter(allergen => 
        allergenNames.includes(allergen.name)
      );
      
      setUserAllergens(allergenObjects);
      setSelectedAllergens(allergenObjects);
    } catch (error) {
      console.error('Error fetching allergens:', error);
      setUserAllergens([]);
      setSelectedAllergens([]);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllergens();
    } else {
      setUserAllergens([]);
      setSelectedAllergens([]);
    }
  }, [user]);

  const applySelectedAllergens = async (allergens: Allergen[]) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      // Update local state immediately for better UX
      setSelectedAllergens(allergens);
      setUserAllergens(allergens);

      // Remove all existing allergens
      await supabase
        .from('user_allergens')
        .delete()
        .eq('user_id', user.id);

      // Add new allergens
      if (allergens.length > 0) {
        const allergensData = allergens.map(allergen => ({
          user_id: user.id,
          allergen: allergen.name,
        }));

        const { error } = await supabase
          .from('user_allergens')
          .insert(allergensData);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating allergens:', error);
      // Revert optimistic update by refetching
      await fetchAllergens();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergen = async (allergen: Allergen) => {
    if (!user || loading) return;
    
    const isCurrentlySelected = selectedAllergens.some(a => a.$id === allergen.$id);
    const updatedAllergens = isCurrentlySelected
      ? selectedAllergens.filter(a => a.$id !== allergen.$id)
      : [...selectedAllergens, allergen];

    await applySelectedAllergens(updatedAllergens);
  };

  return (
    <AllergensContext.Provider
      value={{
        userAllergens,
        selectedAllergens,
        loading,
        applySelectedAllergens,
        toggleAllergen,
      }}
    >
      {children}
    </AllergensContext.Provider>
  );
}

export function useAllergens() {
  const context = useContext(AllergensContext);
  if (context === undefined) {
    throw new Error('useAllergens must be used within an AllergensProvider');
  }
  return context;
}