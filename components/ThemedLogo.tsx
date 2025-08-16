import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import LightLogo from '@/assets/images/smart-bites-logo.png';
import DarkLogo from '@/assets/images/smart-bites-logo.png';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorScheme } from '@/constants/Colors';

const ThemedLogo: React.FC = () => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const logo: ImageSourcePropType = isDark ? DarkLogo : LightLogo;

  return <Image source={logo} style={styles.logoImage} />;
};

export default ThemedLogo;

const getStyles = (colors: typeof ColorScheme.light) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.secondary,
    },
    logoImage: {
      width: 300,
      height: 300,
      marginVertical: 20,
    },
  });
