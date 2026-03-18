import { Redirect } from 'expo-router';
import { useSession } from '@/lib/auth/use-session';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { View, ActivityIndicator } from 'react-native';
import { C } from '@/theme/colors';

export default function Index() {
  const { data: session, isLoading } = useSession();
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const isOnboardingLoaded = useOnboardingStore((s) => s.isLoaded);

  // Show loading state while checking session or onboarding
  if (isLoading || !isOnboardingLoaded) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.cy} />
      </View>
    );
  }

  // Redirect based on auth state
  if (session) {
    if (!hasCompletedOnboarding) {
      return <Redirect href="/onboarding" />;
    }
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
