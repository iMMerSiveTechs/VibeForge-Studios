import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, Sparkles, FileText } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, SlideInRight } from "react-native-reanimated";
import { api } from "@/lib/api/api";
import { useOnboardingStore } from "@/lib/state/onboarding-store";

const COLORS = {
  bg: "#020203",
  surface: "#0B0C10",
  surfaceHigh: "#12141A",
  cyan: "#95CBDE",
  magenta: "#A75FBB",
  violet: "#413672",
  lilac: "#C3A6FF",
  text: "#E8EDF2",
  dim: "#4A5568",
  dimmer: "#2D3748",
};

interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

export default function OnboardingScreen() {
  const [step, setStep] = useState<number>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const router = useRouter();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const { data: templates, isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: () => api.get<Template[]>("/api/templates"),
    enabled: step === 2,
  });

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId) ?? null;

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (selectedTemplateId) {
        return api.post<{ id: string }>(
          `/api/templates/${selectedTemplateId}/instantiate`,
          { name: projectName }
        );
      }
      return api.post<{ id: string }>("/api/templates/blank/instantiate", {
        name: projectName,
      });
    },
    onSuccess: () => {
      completeOnboarding();
      router.replace("/(app)/(tabs)");
    },
  });

  const handleContinueToStep3 = () => {
    if (selectedTemplateId && selectedTemplate) {
      setProjectName(selectedTemplate.name);
    } else {
      setProjectName("My Project");
    }
    setStep(3);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Progress dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            paddingTop: 16,
            paddingBottom: 24,
            gap: 8,
          }}
        >
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={{
                width: s === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: s === step ? COLORS.cyan : COLORS.dimmer,
              }}
            />
          ))}
        </View>

        {step === 1 ? (
          <StepWelcome onNext={() => setStep(2)} />
        ) : null}

        {step === 2 ? (
          <StepTemplates
            templates={templates ?? []}
            loading={templatesLoading}
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            onNext={handleContinueToStep3}
          />
        ) : null}

        {step === 3 ? (
          <StepName
            projectName={projectName}
            onChangeName={setProjectName}
            onSubmit={() => createProjectMutation.mutate()}
            isPending={createProjectMutation.isPending}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      exiting={FadeOut.duration(200)}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: COLORS.violet,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 32,
        }}
      >
        <Zap size={48} color={COLORS.cyan} />
      </View>

      <Text
        style={{
          fontFamily: "monospace",
          fontSize: 28,
          fontWeight: "700",
          color: COLORS.text,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        Welcome to VibeForge
      </Text>

      <Text
        style={{
          fontFamily: "monospace",
          fontSize: 15,
          color: COLORS.dim,
          textAlign: "center",
          lineHeight: 22,
          paddingHorizontal: 16,
          marginBottom: 48,
        }}
      >
        Build apps with AI. Describe what you want, and we'll generate the code.
      </Text>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          backgroundColor: pressed ? COLORS.violet : COLORS.magenta,
          paddingVertical: 16,
          paddingHorizontal: 48,
          borderRadius: 12,
          width: "100%",
          alignItems: "center",
        })}
      >
        <Text
          style={{
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: "700",
            color: COLORS.text,
          }}
        >
          Get Started
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function StepTemplates({
  templates,
  loading,
  selectedId,
  onSelect,
  onNext,
}: {
  templates: Template[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onNext: () => void;
}) {
  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={FadeOut.duration(200)}
      style={{ flex: 1 }}
    >
      <Text
        style={{
          fontFamily: "monospace",
          fontSize: 24,
          fontWeight: "700",
          color: COLORS.text,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Choose a Starter
      </Text>

      <Text
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          color: COLORS.dim,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Pick a template or start from scratch
      </Text>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Start Blank option */}
          <Pressable
            onPress={() => onSelect(null)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? COLORS.surfaceHigh : COLORS.surface,
              borderWidth: 2,
              borderColor: selectedId === null ? COLORS.cyan : COLORS.dimmer,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: COLORS.dimmer,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <FileText size={22} color={COLORS.dim} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "monospace",
                  fontSize: 15,
                  fontWeight: "600",
                  color: COLORS.text,
                }}
              >
                Start Blank
              </Text>
              <Text
                style={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: COLORS.dim,
                  marginTop: 2,
                }}
              >
                Empty project, full creative freedom
              </Text>
            </View>
          </Pressable>

          {/* Template grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {templates.map((template) => {
              const isSelected = selectedId === template.id;
              return (
                <Pressable
                  key={template.id}
                  onPress={() => onSelect(template.id)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? COLORS.surfaceHigh : COLORS.surface,
                    borderWidth: 2,
                    borderColor: isSelected ? COLORS.cyan : COLORS.dimmer,
                    borderRadius: 12,
                    padding: 14,
                    width: "48%",
                    minHeight: 120,
                  })}
                >
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>
                    {template.emoji}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 14,
                      fontWeight: "600",
                      color: COLORS.text,
                      marginBottom: 4,
                    }}
                  >
                    {template.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: COLORS.dim,
                      lineHeight: 16,
                    }}
                    numberOfLines={3}
                  >
                    {template.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      <Pressable
        onPress={onNext}
        style={({ pressed }) => ({
          backgroundColor: pressed ? COLORS.violet : COLORS.magenta,
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: "center",
          marginBottom: 8,
        })}
      >
        <Text
          style={{
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: "700",
            color: COLORS.text,
          }}
        >
          Continue
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function StepName({
  projectName,
  onChangeName,
  onSubmit,
  isPending,
}: {
  projectName: string;
  onChangeName: (name: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={FadeOut.duration(200)}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <Text
        style={{
          fontFamily: "monospace",
          fontSize: 24,
          fontWeight: "700",
          color: COLORS.text,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Name Your Project
      </Text>

      <Text
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          color: COLORS.dim,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        Give your creation a name
      </Text>

      <TextInput
        value={projectName}
        onChangeText={onChangeName}
        placeholder="My Awesome Project"
        placeholderTextColor={COLORS.dimmer}
        autoFocus
        style={{
          fontFamily: "monospace",
          fontSize: 18,
          color: COLORS.text,
          backgroundColor: COLORS.surface,
          borderWidth: 2,
          borderColor: COLORS.violet,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          marginBottom: 32,
        }}
      />

      <Pressable
        onPress={onSubmit}
        disabled={isPending || projectName.trim().length === 0}
        style={({ pressed }) => ({
          backgroundColor:
            isPending || projectName.trim().length === 0
              ? COLORS.dimmer
              : pressed
                ? COLORS.violet
                : COLORS.magenta,
          paddingVertical: 16,
          borderRadius: 12,
          alignItems: "center",
          opacity: isPending || projectName.trim().length === 0 ? 0.6 : 1,
        })}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={COLORS.text} />
        ) : (
          <Text
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              fontWeight: "700",
              color: COLORS.text,
            }}
          >
            Start Forging
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
