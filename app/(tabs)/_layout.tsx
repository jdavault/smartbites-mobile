// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, ChefHat, User } from 'lucide-react-native';
import { Redirect, usePathname } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (loading || pathname?.includes('reset-password')) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  // Calculate appropriate tab bar height and padding - trimmed down
  const tabBarHeight = Platform.select({
    ios: 54 + Math.max(insets.bottom - 12, 4),
    android: 54,
    web: 64,
  });

  const tabBarPaddingBottom = Platform.select({
    ios: Math.max(insets.bottom - 12, 4),
    android: 6,
    web: 12,
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
          paddingTop: 4,
          paddingBottom: tabBarPaddingBottom,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: Platform.OS === 'android' ? 10 : 11,
          fontFamily: 'Inter-Medium',
          marginTop: 0,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color }) => <Search size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color }) => <ChefHat size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
      <Tabs.Screen name="recipe/[id]" options={{ href: null }} />
      <Tabs.Screen name="recipe/search-result" options={{ href: null }} />
    </Tabs>
  );
}
