import { Redirect } from 'expo-router';
import { useSession } from '@/lib/auth/use-session';
import { View, ActivityIndicator } from 'react-native';
import { C } from '@/theme/colors';

export default function Index() {
  const { data: session, isLoading } = useSession();

  // Show loading state while checking session
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.cy} />
      </View>
    );
  }

  // Redirect based on auth state
  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
