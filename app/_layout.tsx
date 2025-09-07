import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Lato_400Regular,
  Lato_700Bold,
} from '@expo-google-fonts/lato';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { RecipesProvider } from '@/contexts/RecipesContext';
import { AllergensProvider } from '@/contexts/AllergensContext';
import { DietaryProvider } from '@/contexts/DietaryContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

// Custom splash screen component
function CustomSplashScreen() {
  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.content}>
        <Image
          source={require('@/assets/images/smart-bites-logo.png')}
          style={splashStyles.logo}
          resizeMode="contain"
        />
        <Text style={splashStyles.tagline}>
          AI-powered recipes + allergy aware restaurant menu search so you can
          dine in or dine out with confidence.
        </Text>
      </View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f8f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginTop: Platform.select({
      ios: -50, // Slightly higher on iOS to match current positioning
      android: -80, // Higher on Android to match iOS look
      default: -50,
    }),
  },
  logo: {
    width: Platform.select({
      ios: 280, // Keep iOS size that you love
      android: 280, // Match iOS size on Android
      default: 280,
    }),
    height: Platform.select({
      ios: 280,
      android: 280,
      default: 280,
    }),
    marginBottom: 24,
  },
  tagline: {
    fontSize: Platform.select({
      ios: 18,
      android: 18,
      default: 18,
    }),
    fontFamily: 'Lato-Regular',
    color: '#FF8866',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
});

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Lato-Regular': Lato_400Regular,
    'Lato-Bold': Lato_700Bold,
  });

  useEffect(() => {
    // Prevent splash screen from auto-hiding
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <CustomSplashScreen />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProfileProvider>
          <AllergensProvider>
            <DietaryProvider>
              <RecipesProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </RecipesProvider>
            </DietaryProvider>
          </AllergensProvider>
        </UserProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}