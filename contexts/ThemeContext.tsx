import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

type ColorShades = { [key: number]: string };
type ColorsType = {
  rice: ColorShades;
  prawn: ColorShades;
  cerulean: ColorShades;
  sunflower: ColorShades;
  ironBlack: ColorShades;
  dietary: string;
  white: string;
  black: string;
  error: string;
  warning: string;
  success: string;
  divider: string;
  dark: ColorShades;
};

export const Colors: ColorsType = {
  rice: {
    50: '#fdfcf9', // Near-white rice paper
    100: '#fbf9f4', // Very light ivory
    200: '#f9f8f2', // Soft warm off-white
    300: '#f2f1ea', // Slightly aged cream
    400: '#e6e2d6', // Muted beige
    500: '#d9d3c3', // 🔸 Base/Default — Calm, natural tan
    600: '#b1ad9e', // Light grayish-tan
    700: '#898779', // Medium mushroom
    800: '#605e55', // Charcoal beige
    900: '#383830', // Dark earth
  },
  prawn: {
    50: '#fff4f1', // Extremely pale prawn tint
    100: '#ffe4dc', // Very light peach
    200: '#ffcbbf', // Light coral
    300: '#ffb1a3', // Soft prawn
    400: '#ff9988', // Gentle pink-orange
    500: '#FF8866', // 🔸 Base/Default — Vibrant prawn/coral
    600: '#e97659', // Warm muted coral (cc6d52-too-brown)
    700: '#99523d', // Dark prawn brown
    800: '#663828', // Deep reddish-brown
    900: '#331c14', // Almost burnt umber
  },
  cerulean: {
    50: '#e3f1f7', // Frosty sky
    100: '#c7e3ef', // Ice blue
    200: '#8ec7df', // Light sea spray
    300: '#56abcd', // Fresh ocean
    400: '#2b90b6', // Bright mid-tone teal
    500: '#0B6082', // 🔸 Base/Default — True cerulean blue
    600: '#094e6a', // Deeper marine blue
    700: '#073c51', // Slate teal
    800: '#052a39', // Near-navy
    900: '#031821', // Almost blackened blue  },
  },
  ironBlack: {
    50: '#e9ebec', // Cloudy silver
    100: '#d3d6d8', // Light graphite
    200: '#a7adb1', // Cool gray
    300: '#7b848a', // Mid-gray with depth
    400: '#4f5b63', // Slate steel
    500: '#253031', // 🔸 Base/Default — Iron black (soft charcoal)
    600: '#1e2627', // Muted obsidian
    700: '#161c1d', // Dense coal
    800: '#0f1314', // Jet black
    900: '#070909', // Deepest black
  },
  sunflower: {
    50: '#FFFDEA', // Barely-there sunlight
    100: '#FEF9C6', // Soft pastel lemon
    200: '#FAF59E', // Gentle golden haze
    300: '#F7F188', // Bright butter yellow
    400: '#F5EF78', // Balanced soft yellow
    500: '#F3ED86', // 🔸 Base/Default — True sunflower yellow
    600: '#E1D65C', // Muted sunflower gold
    700: '#BBAA2F', // Earthy goldenrod
    800: '#9B8C25', // Deep mustard
    900: '#665D1A', // Warm antique gold
  },
  white: '#FFFFFF',
  black: '#000000', // <- add if you used it anywhere
  error: '#EF4444',
  warning: '#F59E0B', // keep parity with old constants
  success: '#10B981',
  divider: 'rgba(0,0,0,0.1)',
  dietary: '#0B6082',
  dark: {
    50: '#f3f4f4', // Very light gray – "Snow Gray"
    100: '#e6e7e8', // Light gray – "Platinum"
    200: '#cdd0d1', // Pale gray – "Gainsboro"
    300: '#b3b8ba', // Muted gray – "Silver Chalice"
    400: '#9aa0a3', // Cool gray – "French Gray"
    500: '#80888c', // Medium cool gray – "Slate Gray"
    600: '#666e72', // Dim gray – "Outer Space"
    700: '#4d5458', // Charcoal
    800: '#2D2D2D', // **New**: Rich charcoal – ideal for backgrounds
    900: '#1a1f24', // Near black – "Jet"`
  },
};

export const ColorScheme = {
  light: {
    background: Colors.rice[300],
    backgroundLight: Colors.rice[300],
    backgroundLighter: Colors.rice[200],
    backgroundRice: Colors.rice[500],
    primaryLighter: Colors.prawn[300],
    primaryLight: Colors.prawn[300],
    primary: Colors.prawn[500],
    primaryDark: Colors.prawn[700],
    accentLight: Colors.cerulean[200],
    accent: Colors.cerulean[500],
    accentDark: Colors.cerulean[700],
    textPrimary: Colors.ironBlack[700],
    card: Colors.white,
    cardLight: Colors.rice[100],
    notification: Colors.error,
    text: Colors.ironBlack[700],
    textSecondary: Colors.ironBlack[500],
    textTertiary: Colors.ironBlack[300],
    textWhite: Colors.white,
    textRice: Colors.rice[500],
    secondaryLight: Colors.sunflower[200],
    secondary: Colors.sunflower[400],
    secondaryDark: Colors.sunflower[700],
    border: Colors.dark[300],
    borderDarker: Colors.dark[600],
    surface: Colors.white,
    error: Colors.error,
    success: Colors.success,
    warning: Colors.warning,
    dietary: Colors.cerulean[600],
  },
  dark: {
    // Background
    background: Colors.ironBlack[500],
    backgroundLight: Colors.ironBlack[400],
    backgroundLighter: Colors.ironBlack[300],
    backgroundRice: Colors.rice[500], // added for parity

    // Brand
    primaryLighter: Colors.prawn[200], // added for parity
    primaryLight: Colors.prawn[200],
    primary: Colors.prawn[400],
    primaryDark: Colors.prawn[500],

    // Accent
    accentLight: Colors.cerulean[200],
    accent: Colors.cerulean[400],
    accentDark: Colors.cerulean[500],

    // Text (keep old names + new alias)
    textPrimary: Colors.rice[500], // added for parity
    text: Colors.rice[500],
    textSecondary: Colors.rice[300],
    textTertiary: Colors.rice[200],
    textWhite: Colors.white,
    textRice: Colors.rice[500],

    // Surfaces (and old 'card' alias)
    surface: Colors.ironBlack[600],
    card: Colors.ironBlack[600],
    cardLight: Colors.ironBlack[500],

    // Secondary
    secondaryLight: Colors.sunflower[200],
    secondary: Colors.sunflower[300],
    secondaryDark: Colors.sunflower[400],

    // Borders (slightly lighter than bg so they’re visible)
    border: Colors.ironBlack[400],
    borderDarker: Colors.ironBlack[300],

    // Status / notifications
    notification: Colors.error,
    error: Colors.error,
    success: Colors.success,
    warning: Colors.warning,

    // Extras
    dietary: '#0B6082',
  },
};

// theme/types.ts
export interface ThemeColors {
  // Backgrounds
  background: string;
  backgroundLight: string;
  backgroundLighter: string;

  // Brand
  primaryLighter: string;
  primaryLight: string;
  primary: string;
  primaryDark: string;

  // Accent
  accentLight: string;
  accent: string;
  accentDark: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textWhite: string;
  textRice: string;

  // Surfaces
  card: string;
  cardLight?: string;

  // Secondary palette
  secondaryLight: string;
  secondary: string;
  secondaryDark: string;

  // Borders
  border: string;
  borderDarker: string;

  // Status / notifications
  notification: string;
  error: string;
  warning: string;
  success: string;

  // Extras
  dietary: string;
  divider?: string;

  // Newer aliases (nice-to-have for new screens)
  text: string; // alias of textPrimary
  surface: string; // alias of card
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
