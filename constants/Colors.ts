export const Colors = {
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
    900: '#031821', // Almost blackened blue
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
    900: '#1a1f24', // Near black – "Jet"
  },
  white: '#FFFFFF',
  black: '#000000',
  error: '#DC2626',
  warning: '#F59E0B',
  success: '#10B981',
  divider: 'rgba(0, 0, 0, 0.1)',
};

export const ColorScheme = {
  light: {
    background: Colors.rice[300],
    backgroundLight: Colors.rice[200],
    backgroundLighter: Colors.rice[100],
    primaryLighter: Colors.prawn[300],
    primaryLight: Colors.prawn[300],
    primary: Colors.prawn[500],
    primaryDark: Colors.prawn[700],
    accentLight: Colors.cerulean[200],
    accent: Colors.cerulean[500],
    accentDark: Colors.cerulean[700],
    textPrimary: Colors.ironBlack[700],
    textSecondary: Colors.ironBlack[500],
    textTertiary: Colors.ironBlack[300],
    textWhite: Colors.white,
    textRice: Colors.rice[500],
    card: Colors.white,
    secondaryLight: Colors.sunflower[200],
    secondary: Colors.sunflower[400],
    secondaryDark: Colors.sunflower[700],
    border: Colors.dark[300],
    borderDarker: Colors.dark[600],
    notification: Colors.error,
  },
  dark: {
    background: Colors.ironBlack[800],
    backgroundLight: Colors.ironBlack[600],
    backgroundLighter: Colors.ironBlack[400],
    primaryLight: Colors.prawn[200],
    primary: Colors.prawn[400],
    primaryDark: Colors.prawn[500],
    accentLight: Colors.cerulean[200],
    accent: Colors.cerulean[400],
    accentDark: Colors.cerulean[500],
    textPrimary: Colors.rice[500],
    textSecondary: Colors.rice[300],
    textTertiary: Colors.rice[200],
    textWhite: Colors.white,
    textRice: Colors.rice[500],
    card: Colors.dark[700],
    cardLight: Colors.dark[500],
    secondaryLight: Colors.sunflower[200],
    secondary: Colors.sunflower[300],
    secondaryDark: Colors.sunflower[400],
    border: Colors.dark[100],
    borderDarker: Colors.dark[300],
    notification: Colors.error,
  },
};

export default {
  Colors,
  ColorScheme,
};
