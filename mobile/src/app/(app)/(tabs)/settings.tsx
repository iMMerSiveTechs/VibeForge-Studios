import React, { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { Settings as SettingsIcon, Shield, Info, Key, Eye, EyeOff } from "lucide-react-native";
import { api } from "@/lib/api/api";
import { authClient } from "@/lib/auth/auth-client";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Button } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";
import { Input } from "@/components/ui/Input";

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
  api_key_claude: "",
  api_key_openai: "",
  api_key_gemini: "",
  model_claude: "claude-sonnet-4-6",
  model_openai: "gpt-4o",
  model_gemini: "gemini-2.5-pro",
  rate_claude: "15",
  rate_openai: "10",
  rate_gemini: "7",
};

const API_KEY_FIELDS = [
  { key: "api_key_claude", label: "Anthropic (Claude)", placeholder: "sk-ant-...", color: C.cy },
  { key: "api_key_openai", label: "OpenAI", placeholder: "sk-...", color: C.green },
  { key: "api_key_gemini", label: "Google (Gemini)", placeholder: "AI...", color: C.mid },
] as const;

export default function SettingsScreen() {
  const [form, setForm] = useState<SettingsMap>({ ...DEFAULT_SETTINGS });
  const [isDirty, setIsDirty] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
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

  // Refetch settings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
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

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await authClient.signOut();
          router.replace("/");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account & Data",
      "This will permanently delete your account and all associated data, including API keys and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/api/me");
              await authClient.signOut();
              router.replace("/");
            } catch {
              showToast("Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
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
        {/* API Keys Section */}
        <Text
          className="text-xs uppercase tracking-widest mb-2"
          style={{ fontFamily: "monospace", color: C.mg }}
        >
          <Key size={10} color={C.mg} /> API Keys
        </Text>
        <Box accentColor={C.mg} className="mb-5">
          {API_KEY_FIELDS.map((field) => {
            const isVisible = visibleKeys[field.key] ?? false;
            const hasValue = (form[field.key] ?? "").length > 0;
            return (
              <View key={field.key} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ color: field.color, fontSize: 10, fontFamily: "monospace", fontWeight: "700", letterSpacing: 1 }}>
                    {field.label.toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setVisibleKeys((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isVisible ? <EyeOff size={14} color={C.dim} /> : <Eye size={14} color={C.dim} />}
                  </TouchableOpacity>
                </View>
                <Input
                  value={form[field.key] ?? ""}
                  onChangeText={(v) => updateField(field.key, v)}
                  placeholder={field.placeholder}
                  secureTextEntry={!isVisible}
                  showSavedIndicator
                />
              </View>
            );
          })}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Shield size={12} color={C.dim} />
            <Text style={{ color: C.dim, fontSize: 9, fontFamily: "monospace", lineHeight: 14, flex: 1 }}>
              Keys are stored on the server and sent over HTTPS. Never stored in plaintext on device.
            </Text>
          </View>
        </Box>

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
                    Add your {providerLabels[provider]} API key above to see models
                  </Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {providerModels.map((m) => {
                        const isSelected = (form[settingKey] ?? "") === m.modelId;
                        const col = providerColors[provider];
                        const tierColor = tierColors[m.tier] ?? C.dim;
                        return (
                          <TouchableOpacity
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
                          </TouchableOpacity>
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
              onPress={handleSignOut}
              variant="ghost"
            />
          </View>
          <Button
            label="DELETE ACCOUNT & DATA"
            onPress={handleDeleteAccount}
            variant="danger"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
