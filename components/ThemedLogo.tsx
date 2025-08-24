import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Platform } from 'react-native';
import LightLogo from '@/assets/images/smart-bites-logo.png';
import DarkLogo from '@/assets/images/smart-bites-logo.png';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

const ThemedLogo: React.FC = () => {
}
interface ThemedLogoProps {
  width?: number;
  height?: number;
}

const ThemedLogo: React.FC<ThemedLogoProps> = ({ width, height }) => {
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, width, height);

  const logo: ImageSourcePropType = isDark ? DarkLogo : LightLogo;

  return <Image source={logo} style={styles.logoImage} />;
};

export default ThemedLogo;

const getStyles = (colors: ThemeColors, width?: number, height?: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.secondary,
    },
    logoImage: {
      width: width || 300,
      height: height || 300,
      marginVertical: 20,
    },
  });
