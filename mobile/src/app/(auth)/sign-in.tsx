import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Mail, ArrowRight, Sparkles } from 'lucide-react-native';
import { authClient } from '@/lib/auth/auth-client';
import { C } from '@/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const buttonScale = useSharedValue(1);
  const errorShake = useSharedValue(0);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const errorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      errorShake.value = withSequence(
        withSpring(-10, { damping: 10 }),
        withSpring(10, { damping: 10 }),
        withSpring(-10, { damping: 10 }),
        withSpring(0, { damping: 10 })
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      errorShake.value = withSequence(
        withSpring(-10, { damping: 10 }),
        withSpring(10, { damping: 10 }),
        withSpring(-10, { damping: 10 }),
        withSpring(0, { damping: 10 })
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError('');
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email.toLowerCase().trim(),
        type: 'sign-in',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to send verification code');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to OTP verification with email as param
      router.push({
        pathname: '/verify-otp' as any,
        params: { email: email.toLowerCase().trim() },
      });
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
      errorShake.value = withSequence(
        withSpring(-10, { damping: 10 }),
        withSpring(10, { damping: 10 }),
        withSpring(-10, { damping: 10 }),
        withSpring(0, { damping: 10 })
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={[C.bg, C.s1, C.s2, C.s1, C.bg]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        className="absolute inset-0"
      />

      {/* Accent glow orbs */}
      <Animated.View
        entering={FadeIn.duration(1000)}
        className="absolute"
        style={{
          top: 120,
          right: 40,
          width: 200,
          height: 200,
          backgroundColor: C.cy,
          opacity: 0.05,
          borderRadius: 100,
          shadowColor: C.cy,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 60,
        }}
      />

      <Animated.View
        entering={FadeIn.duration(1200).delay(200)}
        className="absolute"
        style={{
          bottom: 200,
          left: -50,
          width: 250,
          height: 250,
          backgroundColor: C.green,
          opacity: 0.04,
          borderRadius: 125,
          shadowColor: C.green,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 50,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6" style={{ paddingTop: insets.top }}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(600)} className="items-center mb-12">
            <View
              className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
              style={{
                backgroundColor: `${C.cy}15`,
                borderWidth: 1,
                borderColor: `${C.cy}30`,
                shadowColor: C.cy,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
              }}
            >
              <Sparkles size={36} color={C.cy} strokeWidth={1.5} />
            </View>

            <Text
              className="text-4xl tracking-tight mb-3"
              style={{
                fontFamily: 'System',
                fontWeight: '700',
                color: C.text,
                letterSpacing: -1,
              }}
            >
              Welcome back
            </Text>

            <Text
              className="text-base text-center"
              style={{
                fontFamily: 'System',
                fontWeight: '400',
                color: C.mid,
                lineHeight: 24,
              }}
            >
              Sign in with your email to continue
            </Text>
          </Animated.View>

          {/* Glass card */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)}>
            <BlurView
              intensity={20}
              tint="dark"
              className="rounded-3xl overflow-hidden"
              style={{
                borderWidth: 1,
                borderColor: `${C.b2}80`,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.3,
                shadowRadius: 30,
              }}
            >
              <View className="p-6">
                {/* Email input */}
                <View className="mb-4">
                  <Text
                    className="text-sm mb-3"
                    style={{
                      fontFamily: 'System',
                      fontWeight: '600',
                      color: C.mid,
                      letterSpacing: 0.2,
                    }}
                  >
                    Email address
                  </Text>

                  <View
                    className="rounded-2xl overflow-hidden"
                    style={{
                      backgroundColor: `${C.s2}CC`,
                      borderWidth: 1,
                      borderColor: error ? C.red : `${C.b2}80`,
                    }}
                  >
                    <View className="flex-row items-center px-4 py-4">
                      <Mail size={20} color={C.mid} strokeWidth={2} />
                      <TextInput
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (error) setError('');
                        }}
                        placeholder="you@example.com"
                        placeholderTextColor={C.dim}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        returnKeyType="done"
                        onSubmitEditing={handleSignIn}
                        editable={!isLoading}
                        className="flex-1 ml-3 text-base"
                        style={{
                          fontFamily: 'System',
                          fontWeight: '500',
                          color: C.text,
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Error message */}
                {error ? (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={errorAnimatedStyle}
                    className="mb-4"
                  >
                    <Text
                      className="text-sm text-center"
                      style={{
                        fontFamily: 'System',
                        fontWeight: '500',
                        color: C.red,
                      }}
                    >
                      {error}
                    </Text>
                  </Animated.View>
                ) : null}

                {/* Sign in button */}
                <AnimatedPressable
                  onPress={handleSignIn}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={isLoading}
                  style={buttonAnimatedStyle}
                >
                  <LinearGradient
                    colors={[C.cy, `${C.cy}CC`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      shadowColor: C.cy,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                    }}
                  >
                    <View className="flex-row items-center justify-center py-4 px-6">
                      {isLoading ? (
                        <Animated.View entering={FadeIn.duration(200)}>
                          <Text
                            className="text-base"
                            style={{
                              fontFamily: 'System',
                              fontWeight: '700',
                              color: '#000',
                            }}
                          >
                            Sending code...
                          </Text>
                        </Animated.View>
                      ) : (
                        <>
                          <Text
                            className="text-base mr-2"
                            style={{
                              fontFamily: 'System',
                              fontWeight: '700',
                              color: '#000',
                            }}
                          >
                            Continue
                          </Text>
                          <ArrowRight size={20} color="#000" strokeWidth={2.5} />
                        </>
                      )}
                    </View>
                  </LinearGradient>
                </AnimatedPressable>
              </View>
            </BlurView>
          </Animated.View>

          {/* Footer info */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            className="mt-8"
          >
            <Text
              className="text-sm text-center px-8"
              style={{
                fontFamily: 'System',
                fontWeight: '400',
                color: C.dim,
                lineHeight: 20,
              }}
            >
              We'll send you a verification code to sign in securely
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
