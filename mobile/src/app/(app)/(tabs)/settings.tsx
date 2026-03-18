import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { Settings as SettingsIcon, Shield, Info, BarChart3 } from "lucide-react-native";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Button } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { useFeatureFlags } from "@/lib/feature-flags";

interface SettingsMap {
  [key: string]: string;
}

interface ModelOption {
  provider: string;
  modelId: string;
  displayName: string;
  tier: string;
  recommended: boolean;
  hiddenByDefault: boolean;
}

const DEFAULT_SETTINGS: SettingsMap = {
  model_claude: "claude-sonnet-4-6",
  model_openai: "gpt-4o",
  model_gemini: "gemini-2.5-pro",
  rate_claude: "15",
  rate_openai: "10",
  rate_gemini: "7",
};

const FLAG_TOGGLES: { key: string; label: string }[] = [
  { key: "SHOW_IMAGE_TAB", label: "Image Tab" },
  { key: "SHOW_AUDIO_TAB", label: "Audio Tab" },
  { key: "SHOW_PAYMENT_TAB", label: "Payment Tab" },
  { key: "SHOW_REQUEST_TAB", label: "Request Tab" },
  { key: "SHOW_ENV_TAB", label: "Env Tab" },
  { key: "SHOW_ADVANCED_FORGE", label: "Advanced Forge" },
];

function DeveloperOptionsSection() {
  const showImage = useFeatureFlags((s) => s.SHOW_IMAGE_TAB);
  const showAudio = useFeatureFlags((s) => s.SHOW_AUDIO_TAB);
  const showPayment = useFeatureFlags((s) => s.SHOW_PAYMENT_TAB);
  const showRequest = useFeatureFlags((s) => s.SHOW_REQUEST_TAB);
  const showEnv = useFeatureFlags((s) => s.SHOW_ENV_TAB);
  const showAdvancedForge = useFeatureFlags((s) => s.SHOW_ADVANCED_FORGE);
  const previewTier = useFeatureFlags((s) => s.PREVIEW_TIER);
  const setFlag = useFeatureFlags((s) => s.setFlag);
  const setPreviewTier = useFeatureFlags((s) => s.setPreviewTier);

  const flagValues: Record<string, boolean> = {
    SHOW_IMAGE_TAB: showImage,
    SHOW_AUDIO_TAB: showAudio,
    SHOW_PAYMENT_TAB: showPayment,
    SHOW_REQUEST_TAB: showRequest,
    SHOW_ENV_TAB: showEnv,
    SHOW_ADVANCED_FORGE: showAdvancedForge,
  };

  return (
    <View className="mt-2 mb-5">
      <Text
        className="text-xs uppercase tracking-widest mb-2"
        style={{ fontFamily: "monospace", color: C.mg }}
      >
        Developer Options
      </Text>
      <Box accentColor={C.mg}>
        {FLAG_TOGGLES.map((item, idx) => (
          <View
            key={item.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 10,
              borderBottomWidth: idx < FLAG_TOGGLES.length - 1 ? 1 : 0,
              borderBottomColor: C.b1,
            }}
          >
            <Text
              style={{
                color: C.text,
                fontSize: 12,
                fontFamily: "monospace",
              }}
            >
              {item.label}
            </Text>
            <Switch
              value={flagValues[item.key]}
              onValueChange={(v) => setFlag(item.key, v)}
              trackColor={{ false: C.s2, true: C.mg + "66" }}
              thumbColor={flagValues[item.key] ? C.mg : C.dim}
            />
          </View>
        ))}

        {/* Preview Tier Selector */}
        <View style={{ paddingVertical: 10 }}>
          <Text
            style={{
              color: C.text,
              fontSize: 12,
              fontFamily: "monospace",
              marginBottom: 8,
            }}
          >
            Preview Tier
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([1, 2, 3] as const).map((tier) => {
              const isActive = previewTier === tier;
              return (
                <Pressable
                  key={tier}
                  onPress={() => setPreviewTier(tier)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: isActive ? C.mg : C.b1,
                    backgroundColor: isActive ? C.mg + "22" : C.s2,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? C.mg : C.dim,
                      fontSize: 12,
                      fontFamily: "monospace",
                      fontWeight: isActive ? "700" : "400",
                    }}
                  >
                    T{tier}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Box>
    </View>
  );
}

export default function SettingsScreen() {
  const [form, setForm] = useState<SettingsMap>({ ...DEFAULT_SETTINGS });
  const [isDirty, setIsDirty] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<SettingsMap>("/api/settings"),
  });

  const { data: modelsData } = useQuery({
    queryKey: ["models"],
    queryFn: () => api.get<{ models: ModelOption[]; presetDefaults: Record<string, unknown> }>("/api/models"),
  });

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // Refetch settings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Initialize form with server data merged with defaults
  useEffect(() => {
    if (settings) {
      setForm({
        ...DEFAULT_SETTINGS,
        ...settings,
      });
      setIsDirty(false);
    }
  }, [settings]);

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (data: SettingsMap) =>
      api.put<SettingsMap>("/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setIsDirty(false);
      showToast("Settings saved");
    },
    onError: () => {
      showToast("Failed to save settings");
    },
  });

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    // Auto-save after 2 seconds of no typing
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setForm((current) => {
        saveSettings(current);
        return current;
      });
    }, 2000);
  };

  const handleSave = () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    saveSettings(form);
  };

  const handleSignOut = async () => {
    setShowSignOutDialog(false);
    await authClient.signOut();
    router.replace("/");
  };

  const handleDeleteAccount = async () => {
    setShowDeleteDialog(false);
    try {
      await api.delete("/api/me");
      await authClient.signOut();
      router.replace("/");
    } catch {
      showToast("Failed to delete account. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg items-center justify-center" edges={["top"]}>
        <ActivityIndicator size="large" color={C.cy} />
        <Text
          className="text-vf-dim text-xs mt-3"
          style={{ fontFamily: "monospace" }}
        >
          Loading settings...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pt-3 pb-4">
        <View className="flex-row items-center mb-1">
          <View
            className="w-8 h-8 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: C.mid + "20" }}
          >
            <SettingsIcon size={18} color={C.mid} />
          </View>
          <View>
            <Text
              className="text-vf-text text-lg tracking-widest"
              style={{ fontFamily: "monospace", fontWeight: "bold" }}
            >
              SETTINGS
            </Text>
            <Text
              className="text-vf-dim text-xs tracking-wider"
              style={{ fontFamily: "monospace" }}
            >
              Models & Configuration
            </Text>
          </View>
        </View>
        <View
          className="h-px mt-3"
          style={{
            backgroundColor: C.mid + "30",
            shadowColor: C.mid,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Models Section */}
        <Text
          className="text-vf-green text-xs uppercase tracking-widest mb-2"
          style={{ fontFamily: "monospace" }}
        >
          Default Models
        </Text>
        <Box accentColor={C.green} className="mb-5">
          {(["claude", "openai", "gemini"] as const).map((provider) => {
            const settingKey = `model_${provider}` as keyof typeof form;
            const providerFilter: Record<string, string> = { claude: "anthropic", openai: "openai", gemini: "gemini" };
            const providerModels = (modelsData?.models ?? [])
              .filter((m) => m.provider === providerFilter[provider]);
            const providerLabels: Record<string, string> = { claude: "CLAUDE", openai: "OPENAI", gemini: "GEMINI" };
            const providerColors: Record<string, string> = { claude: C.cy, openai: C.green, gemini: C.mid };
            const tierColors: Record<string, string> = { fast: C.green, smart: C.cy, max: C.mg };

            return (
              <View key={provider} style={{ marginBottom: 16 }}>
                <Text style={{ color: providerColors[provider], fontSize: 10, fontFamily: "monospace", fontWeight: "700", marginBottom: 8, letterSpacing: 1 }}>
                  {providerLabels[provider]}
                </Text>
                {providerModels.length === 0 ? (
                  <Text style={{ color: C.dim, fontSize: 10, fontFamily: "monospace" }}>
                    Add API key above to see models
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {providerModels.map((m) => {
                        const isSelected = (form[settingKey] ?? "") === m.modelId;
                        const col = providerColors[provider];
                        const tierColor = tierColors[m.tier] ?? C.dim;
                        return (
                          <Pressable
                            key={m.modelId}
                            onPress={() => updateField(settingKey as string, m.modelId)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: isSelected ? col : C.b1,
                              backgroundColor: isSelected ? col + "22" : C.s2,
                              minWidth: 100,
                            }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 }}>
                              <Text style={{ color: tierColor, fontSize: 8, fontFamily: "monospace", fontWeight: "700", letterSpacing: 0.5 }}>
                                {m.tier.toUpperCase()}
                              </Text>
                              {m.recommended ? (
                                <View style={{ backgroundColor: col + "30", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                                  <Text style={{ color: col, fontSize: 7, fontFamily: "monospace", fontWeight: "700" }}>REC</Text>
                                </View>
                              ) : null}
                            </View>
                            <Text style={{ color: isSelected ? col : C.text, fontSize: 11, fontFamily: "monospace", fontWeight: isSelected ? "700" : "400" }} numberOfLines={2}>
                              {m.displayName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>
            );
          })}
        </Box>

        {/* Pricing Section */}
        <Text
          className="text-vf-warn text-xs uppercase tracking-widest mb-2"
          style={{ fontFamily: "monospace" }}
        >
          Pricing ($/1M tokens)
        </Text>
        <Box accentColor={C.warn} className="mb-6">
          <View className="space-y-4">
            <Input
              label="Claude Rate"
              value={form.rate_claude ?? ""}
              onChangeText={(v) => updateField("rate_claude", v)}
              placeholder="15"
            />
            <Input
              label="OpenAI Rate"
              value={form.rate_openai ?? ""}
              onChangeText={(v) => updateField("rate_openai", v)}
              placeholder="10"
            />
            <Input
              label="Gemini Rate"
              value={form.rate_gemini ?? ""}
              onChangeText={(v) => updateField("rate_gemini", v)}
              placeholder="7"
            />
          </View>
        </Box>

        {/* Save Button */}
        <View className="mb-1">
          {isDirty && !isSaving ? (
            <Text
              className="text-vf-warn text-xs text-center mb-2"
              style={{ fontFamily: "monospace" }}
            >
              Unsaved changes — tap Save or wait 2 seconds
            </Text>
          ) : null}
          <Button
            label={isSaving ? "SAVING..." : isDirty ? "SAVE SETTINGS *" : "SETTINGS SAVED"}
            onPress={handleSave}
            variant={isDirty ? "primary" : "ghost"}
            loading={isSaving}
          />
        </View>

        {/* Privacy & Security Section */}
        <View className="mt-6">
          <Text
            className="text-vf-cyan text-xs uppercase tracking-widest mb-2"
            style={{ fontFamily: "monospace" }}
          >
            Privacy & Security
          </Text>
          <Box accentColor={C.cy} className="mb-4">
            <View className="flex-row items-start mb-3" style={{ gap: 8 }}>
              <Shield size={14} color={C.cy} style={{ marginTop: 1 }} />
              <Text
                className="text-vf-dim text-xs flex-1"
                style={{ fontFamily: "monospace", lineHeight: 18 }}
              >
                Your API keys are stored securely on our servers and transmitted over HTTPS. They are never stored in plaintext on your device.
              </Text>
            </View>
          </Box>
        </View>

        {/* About Section */}
        <View className="mt-2">
          <Text
            className="text-vf-dim text-xs uppercase tracking-widest mb-2"
            style={{ fontFamily: "monospace" }}
          >
            About
          </Text>
          <Box className="mb-4">
            <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
              <Info size={14} color={C.mid} />
              <Text
                className="text-vf-text text-sm"
                style={{ fontFamily: "monospace", fontWeight: "bold" }}
              >
                VibeForge Studio
              </Text>
            </View>
            <Text
              className="text-vf-dim text-xs"
              style={{ fontFamily: "monospace" }}
            >
              Version 1.0.0
            </Text>
            <Text
              className="text-vf-dim text-xs mt-1"
              style={{ fontFamily: "monospace" }}
            >
              AI-powered cognitive engine for building and designing software.
            </Text>
          </Box>
        </View>

        {/* Usage & Analytics */}
        <View className="mt-2 mb-4">
          <Text
            className="text-xs uppercase tracking-widest mb-2"
            style={{ fontFamily: "monospace", color: C.cy }}
          >
            Insights
          </Text>
          <Box accentColor={C.cy} onPress={() => router.push("/analytics")}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              <BarChart3 size={18} color={C.cy} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: C.text, fontSize: 13, fontFamily: "monospace", fontWeight: "600" }}
                >
                  Usage & Analytics
                </Text>
                <Text
                  style={{ color: C.dim, fontSize: 10, fontFamily: "monospace", marginTop: 2 }}
                >
                  View tokens, costs, and activity
                </Text>
              </View>
              <Text style={{ color: C.dim, fontSize: 16 }}>›</Text>
            </View>
          </Box>
        </View>

        {/* Developer Options Section */}
        <DeveloperOptionsSection />

        {/* Account Section */}
        <View className="mt-2">
          <Text
            className="text-vf-dim text-xs uppercase tracking-widest mb-2"
            style={{ fontFamily: "monospace" }}
          >
            Account
          </Text>
          <View className="mb-3">
            <Button
              label="SIGN OUT"
              onPress={() => setShowSignOutDialog(true)}
              variant="ghost"
            />
          </View>
          <Button
            label="DELETE ACCOUNT & DATA"
            onPress={() => setShowDeleteDialog(true)}
            variant="danger"
          />
        </View>
      </ScrollView>

      {/* Sign Out Dialog */}
      <Dialog
        open={showSignOutDialog}
        onClose={() => setShowSignOutDialog(false)}
        title="Sign Out"
      >
        <Text
          className="text-vf-text text-sm mb-4"
          style={{ fontFamily: "monospace" }}
        >
          Are you sure you want to sign out?
        </Text>
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Button
              label="Cancel"
              onPress={() => setShowSignOutDialog(false)}
              variant="ghost"
            />
          </View>
          <View className="flex-1">
            <Button
              label="Sign Out"
              onPress={handleSignOut}
              variant="danger"
            />
          </View>
        </View>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Account & Data"
      >
        <Text
          className="text-vf-text text-sm mb-4"
          style={{ fontFamily: "monospace" }}
        >
          This will permanently delete your account and all associated data, including API keys and settings. This action cannot be undone.
        </Text>
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Button
              label="Cancel"
              onPress={() => setShowDeleteDialog(false)}
              variant="ghost"
            />
          </View>
          <View className="flex-1">
            <Button
              label="Delete"
              onPress={handleDeleteAccount}
              variant="danger"
            />
          </View>
        </View>
      </Dialog>
    </SafeAreaView>
  );
}
