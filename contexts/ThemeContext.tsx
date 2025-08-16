import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export const Colors = {
  rice: {
    100: '#F8F6F0',
    200: '#F1EDE1',
    300: '#E9E3D2',
    500: '#D9D3C3',
  },
  prawn: {
    300: '#FFB399',
    500: '#FF8866',
    700: '#E6654D',
  },
  cerulean: {
    200: '#5BA3C7',
    500: '#0B6082',
    700: '#085066',
  },
  sunflower: {
    200: '#F7F2A3',
    300: '#F5EF94',
    400: '#F3ED86',
    700: '#D4C65A',
  },
  ironBlack: {
    300: '#7A8B8D',
    400: '#5A6B6D',
    500: '#3A4B4D',
    600: '#2A3A3B',
    700: '#253031',
    800: '#1A2021',
  },
  white: '#FFFFFF',
  dark: {
    100: '#E5E5E5',
    300: '#CCCCCC',
    500: '#999999',
    600: '#666666',
    700: '#404040',
  },
  error: '#EF4444',
};

export const ColorScheme = {
  light: {
    background: '#f2f1ea', // Custom light background
    backgroundLight: Colors.rice[300],
    backgroundLighter: Colors.rice[200],
    primaryLighter: Colors.prawn[300],
    primaryLight: Colors.prawn[300],
    primary: Colors.prawn[500],
    primaryDark: Colors.prawn[700],
    accentLight: Colors.cerulean[200],
    accent: Colors.cerulean[500],
    accentDark: Colors.cerulean[700],
    text: Colors.ironBlack[700],
    textSecondary: Colors.ironBlack[500],
    textTertiary: Colors.ironBlack[300],
    textWhite: Colors.white,
    textRice: Colors.rice[500],
    surface: Colors.white,
    secondaryLight: Colors.sunflower[200],
    secondary: Colors.sunflower[400],
    secondaryDark: Colors.sunflower[700],
    border: Colors.dark[300],
    borderDarker: Colors.dark[600],
    error: Colors.error,
    success: '#10B981',
    warning: '#F59E0B',
    dietary: '#073c51',
  },
  dark: {
    background: '#253031', // Iron Black
    backgroundLight: Colors.ironBlack[600],
    backgroundLighter: Colors.ironBlack[500],
    primaryLight: Colors.prawn[200],
    primary: Colors.prawn[400],
    primaryDark: Colors.prawn[500],
    accentLight: Colors.cerulean[200],
    accent: Colors.cerulean[400],
    accentDark: Colors.cerulean[500],
    text: Colors.rice[500],
    textSecondary: Colors.rice[300],
    textTertiary: Colors.rice[200],
    textWhite: Colors.white,
    textRice: Colors.rice[500],
    surface: Colors.ironBlack[600],
    secondaryLight: Colors.sunflower[200],
    secondary: Colors.sunflower[300],
    secondaryDark: Colors.sunflower[400],
    border: Colors.ironBlack[400],
    borderDarker: Colors.ironBlack[300],
    error: Colors.error,
    success: '#10B981',
    warning: '#F59E0B',
    dietary: '#073c51',
  },
};

interface ThemeColors {
  background: string;
  backgroundLight: string;
  backgroundLighter: string;
  primaryLighter: string;
  primaryLight: string;
  primary: string;
  primaryDark: string;
  accentLight: string;
  accent: string;
  accentDark: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textWhite: string;
  textRice: string;
  card: string;
  cardLight?: string;
  secondaryLight: string;
  secondary: string;
  secondaryDark: string;
  border: string;
  borderDarker: string;
  notification: string;
}

interface ThemeContextType {
  colorScheme: ColorSchemeName;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorSchemeName>('light');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  };

  const isDark = colorScheme === 'dark';
  const colors = isDark ? ColorScheme.dark : ColorScheme.light;

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        colors,
        toggleTheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}