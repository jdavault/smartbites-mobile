// components/Auth/SocialLoginButtons.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  onGooglePress: () => Promise<void> | void;
  onApplePress: () => Promise<void> | void;
  loadingProvider?: 'google' | 'apple' | null;
  showApple?: boolean; // in case you ever want to hide Apple on Android/web
};

export const SocialLoginButtons: React.FC<Props> = ({
  onGooglePress,
  onApplePress,
  loadingProvider = null,
  showApple = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {/* Google */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.googleButton,
          { backgroundColor: colors.surface },
        ]}
        onPress={onGooglePress}
        activeOpacity={0.8}
        disabled={loadingProvider === 'google'}
      >
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            {/* 👇 Replace with your actual Google "G" PNG */}
            <Image
              source={require('@/assets/icons/google.png')}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>
          {loadingProvider === 'google' ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Text style={[styles.text, { color: colors.textPrimary }]}>
              Continue with Google
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Apple */}
      {showApple && (
        <TouchableOpacity
          style={[styles.button, styles.appleButton]}
          onPress={onApplePress}
          activeOpacity={0.8}
          disabled={loadingProvider === 'apple'}
        >
          <View style={styles.content}>
            <View style={styles.iconWrapper}>
              {/* 👇 Replace with your actual white Apple logo PNG */}
              <Image
                source={require('@/assets/icons/apple_white.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
            {loadingProvider === 'apple' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.text, styles.appleText]}>
                Continue with Apple
              </Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const isWeb = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    // Subtle shadow
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleButton: {
    // backgroundColor comes from theme
  },
  appleButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  iconWrapper: {
    width: 22,
    height: 22,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    height: 20,
  },
  text: {
    fontSize: isWeb ? 15 : 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  appleText: {
    color: '#FFFFFF',
  },
});

export default SocialLoginButtons;
