import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Plus, Trash2, Eye, EyeOff, Shield, X } from "lucide-react-native";
import { C } from "@/theme/colors";
import { api } from "@/lib/api/api";
import { useToastStore } from "@/lib/state/toast-store";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";

const ENV_PREFIX = "env_var_";

interface SettingsMap {
  [key: string]: string;
}

interface EnvVar {
  key: string;
  rawKey: string; // key without prefix
  value: string;
}

function maskValue(value: string): string {
  if (!value || value.length === 0) return "";
  if (value.length <= 4) return "****";
  return value.slice(0, 2) + "*".repeat(Math.min(value.length - 2, 20));
}

export default function EnvTab() {
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<SettingsMap>("/api/settings"),
  });

  // Extract env vars from settings
  const envVars: EnvVar[] = settings
    ? Object.entries(settings)
        .filter(([key]) => key.startsWith(ENV_PREFIX))
        .map(([key, value]) => ({
          key,
          rawKey: key.slice(ENV_PREFIX.length),
          value,
        }))
    : [];

  const pendingToastRef = React.useRef<string>("");

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (data: SettingsMap) =>
      api.put<SettingsMap>("/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      if (pendingToastRef.current) {
        showToast(pendingToastRef.current);
        pendingToastRef.current = "";
      }
    },
    onError: () => {
      pendingToastRef.current = "";
      showToast("Failed to save");
    },
  });

  const handleAdd = () => {
    if (!newKey.trim()) {
      showToast("Variable name is required");
      return;
    }
    if (!newValue.trim()) {
      showToast("Value is required");
      return;
    }

    const sanitizedKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const fullKey = ENV_PREFIX + sanitizedKey;

    const updated: SettingsMap = {
      ...(settings ?? {}),
      [fullKey]: newValue.trim(),
    };

    pendingToastRef.current = `${sanitizedKey} added`;
    saveSettings(updated);
    setNewKey("");
    setNewValue("");
    setIsAdding(false);
  };

  const handleDelete = (key: string, rawKey: string) => {
    const updated: SettingsMap = { ...(settings ?? {}) };
    delete updated[key];
    pendingToastRef.current = `${rawKey} removed`;
    saveSettings(updated);
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: C.warn + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <KeyRound size={16} color={C.warn} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: C.text,
                  fontSize: 18,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  letterSpacing: 4,
                }}
              >
                ENV VARS
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
              >
                {envVars.length} variable{envVars.length !== 1 ? "s" : ""} stored
              </Text>
            </View>
            <Pressable
              onPress={() => setIsAdding((v) => !v)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                backgroundColor: pressed ? C.warn + "30" : C.warn + "18",
                borderWidth: 1,
                borderColor: C.warn + "60",
              })}
            >
              {isAdding ? (
                <X size={13} color={C.warn} />
              ) : (
                <Plus size={13} color={C.warn} />
              )}
              <Text
                style={{
                  color: C.warn,
                  fontSize: 11,
                  fontFamily: "monospace",
                  fontWeight: "700",
                  letterSpacing: 1,
                }}
              >
                {isAdding ? "CANCEL" : "ADD"}
              </Text>
            </Pressable>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: C.warn + "30",
              marginTop: 12,
              shadowColor: C.warn,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Security badge */}
          <Box accentColor={C.cy} className="mb-5">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Shield size={13} color={C.cy} />
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                  flex: 1,
                  lineHeight: 17,
                }}
              >
                Environment variables are stored securely server-side. Values are never exposed in app bundles.
              </Text>
            </View>
          </Box>

          {/* Add form */}
          {isAdding ? (
            <Box accentColor={C.warn} className="mb-5">
              <Text
                style={{
                  color: C.warn,
                  fontSize: 10,
                  fontFamily: "monospace",
                  fontWeight: "700",
                  letterSpacing: 2,
                  marginBottom: 12,
                }}
              >
                NEW VARIABLE
              </Text>

              <View style={{ marginBottom: 10 }}>
                <Text
                  style={{
                    color: C.dim,
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: 1,
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Name
                </Text>
                <TextInput
                  value={newKey}
                  onChangeText={setNewKey}
                  placeholder="MY_API_KEY"
                  placeholderTextColor={C.dim}
                  autoCapitalize="characters"
                  style={{
                    backgroundColor: C.bg,
                    borderWidth: 1,
                    borderColor: C.b2,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: C.text,
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                />
              </View>

              <View style={{ marginBottom: 14 }}>
                <Text
                  style={{
                    color: C.dim,
                    fontSize: 10,
                    fontFamily: "monospace",
                    letterSpacing: 1,
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Value
                </Text>
                <TextInput
                  value={newValue}
                  onChangeText={setNewValue}
                  placeholder="Enter value..."
                  placeholderTextColor={C.dim}
                  secureTextEntry
                  style={{
                    backgroundColor: C.bg,
                    borderWidth: 1,
                    borderColor: C.b2,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: C.text,
                    fontSize: 13,
                    fontFamily: "monospace",
                  }}
                />
              </View>

              <Button
                label={isSaving ? "SAVING..." : "SAVE VARIABLE"}
                onPress={handleAdd}
                loading={isSaving}
                variant="primary"
              />
            </Box>
          ) : null}

          {/* Env vars list */}
          {isLoading ? (
            <View style={{ alignItems: "center", paddingTop: 40 }}>
              <ActivityIndicator size="small" color={C.warn} />
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                  marginTop: 8,
                }}
              >
                Loading...
              </Text>
            </View>
          ) : envVars.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingTop: 32,
                paddingBottom: 20,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: C.s1,
                  borderWidth: 1,
                  borderColor: C.b2,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <KeyRound size={24} color={C.dim} />
              </View>
              <Text
                style={{
                  color: C.text,
                  fontSize: 14,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                NO VARIABLES
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 12,
                  fontFamily: "monospace",
                  textAlign: "center",
                  lineHeight: 19,
                }}
              >
                Add environment variables to store API keys and secrets securely
              </Text>
            </View>
          ) : (
            <>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Stored Variables
              </Text>

              {envVars.map((envVar) => {
                const visible = showValues[envVar.key] ?? false;
                return (
                  <View
                    key={envVar.key}
                    style={{
                      backgroundColor: C.s1,
                      borderWidth: 1,
                      borderColor: C.b1,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: C.warn,
                          fontSize: 12,
                          fontFamily: "monospace",
                          fontWeight: "700",
                          letterSpacing: 1,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {envVar.rawKey}
                      </Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Pressable
                          onPress={() => toggleShowValue(envVar.key)}
                          style={({ pressed }) => ({
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            backgroundColor: pressed
                              ? C.b2
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                          })}
                        >
                          {visible ? (
                            <EyeOff size={13} color={C.mid} />
                          ) : (
                            <Eye size={13} color={C.mid} />
                          )}
                        </Pressable>

                        <Pressable
                          onPress={() =>
                            handleDelete(envVar.key, envVar.rawKey)
                          }
                          style={({ pressed }) => ({
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            backgroundColor: pressed
                              ? C.red + "30"
                              : "transparent",
                            alignItems: "center",
                            justifyContent: "center",
                          })}
                        >
                          <Trash2 size={13} color={C.red} />
                        </Pressable>
                      </View>
                    </View>

                    <Text
                      style={{
                        color: visible ? C.text : C.dim,
                        fontSize: 12,
                        fontFamily: "monospace",
                        letterSpacing: visible ? 0 : 2,
                      }}
                      numberOfLines={visible ? undefined : 1}
                    >
                      {visible ? envVar.value : maskValue(envVar.value)}
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
