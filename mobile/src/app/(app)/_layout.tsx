import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/lib/auth/use-session';
import { View, ActivityIndicator } from 'react-native';
import { C } from '@/theme/colors';

export default function AppLayout() {
  const { data: session, isLoading } = useSession();

  // Show loading state while checking session
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.cy} />
      </View>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  // User is authenticated, show the app
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
