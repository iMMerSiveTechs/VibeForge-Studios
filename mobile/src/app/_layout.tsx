import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Toast } from '@/components/ui/Toast';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { authClient } from '@/lib/auth/auth-client';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const vibeforgeTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#050505',
    card: '#0D0D0D',
    border: '#1E1E1E',
    primary: '#00FFFF',
    text: '#F0F0F0',
  },
};

function RootLayoutNav() {
  return (
    <ThemeProvider value={vibeforgeTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#050505' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="project-detail" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="project-ide" options={{ headerShown: false, presentation: 'card' }} />
      </Stack>
      <Toast />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load session and other initialization
    const init = async () => {
      try {
        await authClient.getSession();
      } catch (error) {
        console.error('Session init error:', error);
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

  // Return null until ready to prevent flash
  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <View style={{ flex: 1 }} onLayout={() => ready && SplashScreen.hideAsync()}>
            <StatusBar style="light" />
            <RootLayoutNav />
          </View>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
