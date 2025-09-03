import React, { createContext, useContext, useState, useEffect } from 'react';
import { CookingMethodsService } from '@/services/cookingMethodsService';
import { useAuth } from './AuthContext';

export interface CookingMethod {
  $id: string;
  name: string;
  description?: string;
}

interface CookingMethodsContextType {
  cookingMethods: CookingMethod[];
  loading: boolean;
  refreshCookingMethods: () => Promise<void>;
}

const CookingMethodsContext = createContext<CookingMethodsContextType | undefined>(undefined);

export function CookingMethodsProvider({ children }: { children: React.ReactNode }) {
  const [cookingMethods, setCookingMethods] = useState<CookingMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchCookingMethods = async () => {
    try {
      setLoading(true);
      const methods = await CookingMethodsService.getAllCookingMethods();
      setCookingMethods(methods);
    } catch (error) {
      console.error('Error fetching cooking methods:', error);
      setCookingMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCookingMethods();
    } else {
      setCookingMethods([]);
    }
  }, [user]);

  const refreshCookingMethods = async () => {
    await fetchCookingMethods();
  };

  return (
    <CookingMethodsContext.Provider
      value={{
        cookingMethods,
        loading,
        refreshCookingMethods,
      }}
    >
      {children}
    </CookingMethodsContext.Provider>
  );
}

export function useCookingMethods() {
  const context = useContext(CookingMethodsContext);
  if (context === undefined) {
    throw new Error('useCookingMethods must be used within a CookingMethodsProvider');
  }
  return context;
}