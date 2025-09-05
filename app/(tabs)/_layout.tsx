import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, ChefHat, User } from 'lucide-react-native';
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  // Calculate appropriate tab bar height and padding
  const tabBarHeight = Platform.select({
    ios: 70 + Math.max(insets.bottom - 8, 8), // iOS: add some bottom padding but not too much
    android: 60, // Android: much smaller height, no extra bottom padding
    web: 70 + 16, // Web: add extra padding to prevent cutoff
  });

  const tabBarPaddingBottom = Platform.select({
    ios: Math.max(insets.bottom - 4, 8), // iOS: respect safe area but reduce it slightly
    android: 8, // Android: minimal bottom padding
    web: 16, // Web: extra padding to prevent cutoff
  });
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ size, color }) => (
            <Search size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ size, color }) => (
            <ChefHat size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={22} color={color} />
          ),
        }}
      />
     <Tabs.Screen
        name="recipe/[id]"
       options={{ href: null }}
     />
     <Tabs.Screen
        name="recipe/search-result"
        options={{ href: null }}
      />
    </Tabs>
  );
}