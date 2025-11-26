// app/auth.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function AuthCallbackScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#F9F8F2', // Your rice background
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator size="large" color="#FF8866" />
      <Text
        style={{
          marginTop: 12,
          color: '#253031',
          fontSize: 16,
          fontFamily: 'Inter-SemiBold',
        }}
      >
        Completing sign-in...
      </Text>
    </View>
  );
}
