import React from "react";
import { Tabs } from "expo-router";
import {
  Zap,
  Settings,
  Eye,
  Hammer,
  ImageIcon,
  Music,
  CreditCard,
  KeyRound,
  MessageSquarePlus,
} from "lucide-react-native";
import { C } from "@/theme/colors";
import { useFeatureFlags } from "@/lib/feature-flags";

export default function TabLayout() {
  const showImage = useFeatureFlags((s) => s.SHOW_IMAGE_TAB);
  const showAudio = useFeatureFlags((s) => s.SHOW_AUDIO_TAB);
  const showPayment = useFeatureFlags((s) => s.SHOW_PAYMENT_TAB);
  const showRequest = useFeatureFlags((s) => s.SHOW_REQUEST_TAB);
  const showEnv = useFeatureFlags((s) => s.SHOW_ENV_TAB);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.s1,
          borderTopColor: C.b1,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: C.cy,
        tabBarInactiveTintColor: C.dim,
        tabBarLabelStyle: {
          fontFamily: "monospace",
          fontSize: 8,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        },
        tabBarShowLabel: true,
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Projects",
          tabBarIcon: ({ color }: { color: string }) => (
            <Zap size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="forge"
        options={{
          title: "Forge",
          tabBarIcon: ({ color }: { color: string }) => (
            <Hammer size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="preview"
        options={{
          title: "Preview",
          tabBarIcon: ({ color }: { color: string }) => (
            <Eye size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="image"
        options={{
          title: "Image",
          href: showImage ? undefined : null,
          tabBarIcon: ({ color }: { color: string }) => (
            <ImageIcon size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          title: "Audio",
          href: showAudio ? undefined : null,
          tabBarIcon: ({ color }: { color: string }) => (
            <Music size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          title: "Payment",
          href: showPayment ? undefined : null,
          tabBarIcon: ({ color }: { color: string }) => (
            <CreditCard size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="env"
        options={{
          title: "Env",
          href: showEnv ? undefined : null,
          tabBarIcon: ({ color }: { color: string }) => (
            <KeyRound size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: "Request",
          href: showRequest ? undefined : null,
          tabBarIcon: ({ color }: { color: string }) => (
            <MessageSquarePlus size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }: { color: string }) => (
            <Settings size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
