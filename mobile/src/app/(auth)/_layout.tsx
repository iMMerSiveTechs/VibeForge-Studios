import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/lib/auth/use-session';
import { View, ActivityIndicator } from 'react-native';
import { C } from '@/theme/colors';

export default function AuthLayout() {
  const { data: session, isLoading } = useSession();

  // Show loading state while checking session
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.cy} />
      </View>
    );
  }

  // Redirect to app if already authenticated
  if (session) {
    return <Redirect href="/" />;
  }

  // User is not authenticated, show auth screens
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
    </Stack>
  );
}
