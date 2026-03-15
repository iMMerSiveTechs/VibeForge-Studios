import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Shield, Check } from 'lucide-react-native';
import { OtpInput } from 'react-native-otp-entry';
import { authClient } from '@/lib/auth/auth-client';
import { useInvalidateSession } from '@/lib/auth/use-session';
import { C } from '@/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function VerifyOtpScreen() {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const invalidateSession = useInvalidateSession();

  const email = typeof params.email === 'string' ? params.email : '';

  const errorShake = useSharedValue(0);
  const successScale = useSharedValue(0);

  const errorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShake.value }],
  }));

  const successAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  useEffect(() => {
    if (!email) {
      router.replace('/sign-in' as any);
    }
  }, [email, router]);

  const handleVerify = async (code: string) => {
    if (code.length !== 6) return;

    setIsVerifying(true);
    setError('');

    try {
      // Use signIn.emailOtp instead of emailOtp.verifyEmail
      // This endpoint creates the user account if it doesn't exist
      const result = await authClient.signIn.emailOtp({
        email,
        otp: code,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Invalid verification code');
      }

      // Success animation
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      successScale.value = withSpring(1, { damping: 12, stiffness: 200 });

      // Invalidate session to trigger auth state update
      invalidateSession();

      // Wait for animation then navigate
      await new Promise((resolve) => setTimeout(resolve, 1200));
      router.replace('/' as any);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      setOtp('');
      errorShake.value = withSequence(
        withSpring(-10, { damping: 10 }),
        withSpring(10, { damping: 10 }),
        withSpring(-10, { damping: 10 }),
        withSpring(0, { damping: 10 })
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || isResending) return;

    setIsResending(true);
    setError('');

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });

      if (result.error) {
        throw new Error(result.error.message || 'Failed to resend code');
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Resend error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resend code');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    router.back();
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
          top: 100,
          left: -20,
          width: 220,
          height: 220,
          backgroundColor: C.green,
          opacity: 0.04,
          borderRadius: 110,
          shadowColor: C.green,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 60,
        }}
      />

      <Animated.View
        entering={FadeIn.duration(1200).delay(200)}
        className="absolute"
        style={{
          bottom: 150,
          right: -40,
          width: 200,
          height: 200,
          backgroundColor: C.cy,
          opacity: 0.05,
          borderRadius: 100,
          shadowColor: C.cy,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 50,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1" style={{ paddingTop: insets.top }}>
          {/* Back button */}
          <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-4">
            <Pressable
              onPress={handleBack}
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-60"
              style={{
                backgroundColor: `${C.s2}CC`,
                borderWidth: 1,
                borderColor: `${C.b2}80`,
              }}
            >
              <ArrowLeft size={20} color={C.text} strokeWidth={2} />
            </Pressable>
          </Animated.View>

          <View className="flex-1 justify-center px-6">
            {/* Header */}
            <Animated.View entering={FadeInDown.duration(600).delay(100)} className="items-center mb-12">
              <View
                className="w-20 h-20 rounded-3xl items-center justify-center mb-6"
                style={{
                  backgroundColor: `${C.green}15`,
                  borderWidth: 1,
                  borderColor: `${C.green}30`,
                  shadowColor: C.green,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.2,
                  shadowRadius: 20,
                }}
              >
                <Shield size={36} color={C.green} strokeWidth={1.5} />
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
                Verify your email
              </Text>

              <Text
                className="text-base text-center px-4"
                style={{
                  fontFamily: 'System',
                  fontWeight: '400',
                  color: C.mid,
                  lineHeight: 24,
                }}
              >
                Enter the 6-digit code we sent to
              </Text>

              <Text
                className="text-base mt-1"
                style={{
                  fontFamily: 'System',
                  fontWeight: '600',
                  color: C.cy,
                }}
              >
                {email}
              </Text>
            </Animated.View>

            {/* Glass card */}
            <Animated.View entering={FadeInDown.duration(600).delay(200)}>
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
                  {/* OTP Input */}
                  <View className="mb-4">
                    <OtpInput
                      numberOfDigits={6}
                      focusColor={C.cy}
                      onTextChange={setOtp}
                      onFilled={handleVerify}
                      disabled={isVerifying}
                      autoFocus
                      theme={{
                        containerStyle: {
                          gap: 8,
                        },
                        pinCodeContainerStyle: {
                          backgroundColor: `${C.s2}CC`,
                          borderColor: error ? C.red : `${C.b2}80`,
                          borderWidth: 1,
                          borderRadius: 16,
                          height: 60,
                          width: 50,
                        },
                        pinCodeTextStyle: {
                          fontFamily: 'System',
                          fontSize: 24,
                          fontWeight: '700',
                          color: C.text,
                        },
                        focusedPinCodeContainerStyle: {
                          borderColor: C.cy,
                          borderWidth: 2,
                          backgroundColor: `${C.cy}10`,
                        },
                      }}
                    />
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

                  {/* Resend button */}
                  <View className="items-center mt-2">
                    <Text
                      className="text-sm"
                      style={{
                        fontFamily: 'System',
                        fontWeight: '400',
                        color: C.mid,
                      }}
                    >
                      Didn't receive a code?
                    </Text>
                    <Pressable
                      onPress={handleResend}
                      disabled={isResending}
                      className="mt-2 py-2 px-4 active:opacity-60"
                    >
                      <Text
                        className="text-base"
                        style={{
                          fontFamily: 'System',
                          fontWeight: '600',
                          color: isResending ? C.dim : C.cy,
                        }}
                      >
                        {isResending ? 'Sending...' : 'Resend code'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </BlurView>
            </Animated.View>

            {/* Verifying state */}
            {isVerifying ? (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="mt-6 items-center"
              >
                <Text
                  className="text-base"
                  style={{
                    fontFamily: 'System',
                    fontWeight: '500',
                    color: C.mid,
                  }}
                >
                  Verifying...
                </Text>
              </Animated.View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Success overlay */}
      <Animated.View
        style={[
          successAnimatedStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${C.bg}F0`,
          },
        ]}
        pointerEvents="none"
      >
        <BlurView intensity={40} tint="dark" className="rounded-full" style={{ padding: 30 }}>
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{
              backgroundColor: C.green,
              shadowColor: C.green,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 30,
            }}
          >
            <Check size={48} color="#000" strokeWidth={3} />
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
}
