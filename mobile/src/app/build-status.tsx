import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Hammer, Package, Download, ExternalLink,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { C } from "@/theme/colors";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";

interface Build {
  id: string;
  projectId: string;
  platform: string;
  profile: string;
  status: "QUEUED" | "BUILDING" | "SUCCESS" | "FAILED";
  easBuildId: string;
  artifactUrl: string | null;
  logsUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

type StepKey = "QUEUED" | "BUILDING" | "COMPLETE";

const STEPS: { key: StepKey; label: string; icon: React.ComponentType<any> }[] = [
  { key: "QUEUED", label: "Queued", icon: Clock },
  { key: "BUILDING", label: "Building", icon: Hammer },
  { key: "COMPLETE", label: "Complete", icon: Package },
];

function getStepState(
  stepKey: StepKey,
  status: Build["status"]
): "done" | "active" | "pending" {
  if (status === "QUEUED") {
    return stepKey === "QUEUED" ? "active" : "pending";
  }
  if (status === "BUILDING") {
    if (stepKey === "QUEUED") return "done";
    if (stepKey === "BUILDING") return "active";
    return "pending";
  }
  // SUCCESS or FAILED
  if (stepKey === "COMPLETE") return status === "SUCCESS" ? "done" : "pending";
  return "done";
}

function formatTime(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function BuildStatusScreen() {
  const { projectId, buildId } = useLocalSearchParams<{
    projectId: string;
    buildId: string;
  }>();
  const router = useRouter();

  const { data: build, isLoading, error } = useQuery<Build>({
    queryKey: ["build", projectId, buildId],
    queryFn: () => api.get<Build>(`/api/builds/${projectId}/${buildId}`),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "QUEUED" || s === "BUILDING" ? 5000 : false;
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={C.text} />
        </Pressable>
        <Text style={{ fontFamily: "monospace", fontSize: 18, fontWeight: "700", color: C.text }}>
          Build Status
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {isLoading ? (
          <View style={{ alignItems: "center", paddingTop: 80 }}>
            <ActivityIndicator size="large" color={C.cy} />
          </View>
        ) : error ? (
          <Box>
            <Text style={{ color: C.red, fontFamily: "monospace", fontSize: 13 }}>
              Failed to load build: {(error as Error).message}
            </Text>
          </Box>
        ) : build ? (
          <>
            {/* Progress Steps */}
            <Box>
              <Text style={{ fontFamily: "monospace", fontSize: 13, color: C.dim, marginBottom: 16 }}>
                PROGRESS
              </Text>
              {STEPS.map((step, i) => {
                const state = getStepState(step.key, build.status);
                const Icon = step.icon;
                const isLast = i === STEPS.length - 1;
                const failed = step.key === "COMPLETE" && build.status === "FAILED";
                const circleColor = failed ? C.red : state === "done" ? C.green : state === "active" ? C.cy : C.b2;
                const textColor = state === "pending" ? C.dim : C.text;

                return (
                  <View key={step.key} style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: isLast ? 0 : 4 }}>
                    {/* Indicator column */}
                    <View style={{ alignItems: "center", width: 32 }}>
                      <View style={{
                        width: 28, height: 28, borderRadius: 14,
                        backgroundColor: state === "done" || failed ? circleColor : "transparent",
                        borderWidth: state === "done" || failed ? 0 : 2,
                        borderColor: circleColor,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {state === "done" && !failed ? (
                          <CheckCircle size={16} color={C.bg} />
                        ) : failed ? (
                          <XCircle size={16} color={C.text} />
                        ) : state === "active" ? (
                          <ActivityIndicator size="small" color={C.cy} />
                        ) : (
                          <Icon size={14} color={C.dim} />
                        )}
                      </View>
                      {!isLast && (
                        <View style={{
                          width: 2, height: 24, backgroundColor: state === "done" ? C.green : C.b1,
                          marginVertical: 2,
                        }} />
                      )}
                    </View>

                    {/* Label */}
                    <View style={{ marginLeft: 12, paddingTop: 4 }}>
                      <Text style={{ fontFamily: "monospace", fontSize: 14, fontWeight: "600", color: textColor }}>
                        {failed ? "Failed" : step.label}
                      </Text>
                      {state === "active" && (
                        <Text style={{ fontFamily: "monospace", fontSize: 11, color: C.cy, marginTop: 2 }}>
                          In progress...
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </Box>

            {/* Build Details */}
            <View style={{ marginTop: 16 }}>
              <Box>
                <Text style={{ fontFamily: "monospace", fontSize: 13, color: C.dim, marginBottom: 12 }}>
                  DETAILS
                </Text>
                {[
                  { label: "Platform", value: build.platform },
                  { label: "Profile", value: build.profile },
                  { label: "Started", value: formatTime(build.startedAt) },
                  { label: "Completed", value: formatTime(build.completedAt) },
                ].map((row) => (
                  <View key={row.label} style={{
                    flexDirection: "row", justifyContent: "space-between",
                    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.b1,
                  }}>
                    <Text style={{ fontFamily: "monospace", fontSize: 12, color: C.dim }}>
                      {row.label}
                    </Text>
                    <Text style={{ fontFamily: "monospace", fontSize: 12, color: C.text }}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </Box>
            </View>

            {/* Success state */}
            {build.status === "SUCCESS" && (
              <View style={{ marginTop: 16, gap: 12 }}>
                {build.artifactUrl ? (
                  <Button
                    label="Download Artifact"
                    onPress={() => {}}
                    variant="primary"
                    icon={<Download size={16} color="#000" />}
                  />
                ) : null}
                <Box accentColor={C.cy}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <ExternalLink size={14} color={C.cy} />
                    <Text style={{ fontFamily: "monospace", fontSize: 13, fontWeight: "600", color: C.cy }}>
                      Submit to App Store
                    </Text>
                  </View>
                  <Text style={{ fontFamily: "monospace", fontSize: 11, color: C.mid, lineHeight: 16 }}>
                    Tap Share in the top-right corner of the Vibecode App and select "Submit to App Store" to begin the submission process.
                  </Text>
                </Box>
              </View>
            )}

            {/* Failed state */}
            {build.status === "FAILED" && (
              <View style={{ marginTop: 16, gap: 12 }}>
                <Box accentColor={C.red}>
                  <Text style={{ fontFamily: "monospace", fontSize: 13, fontWeight: "600", color: C.red, marginBottom: 6 }}>
                    Build Failed
                  </Text>
                  <Text style={{ fontFamily: "monospace", fontSize: 11, color: C.mid, lineHeight: 16 }}>
                    Check the build logs for error details. Common issues include missing dependencies, type errors, or invalid configuration.
                  </Text>
                </Box>
                {build.logsUrl ? (
                  <Button
                    label="View Logs"
                    onPress={() => {}}
                    variant="ghost"
                    icon={<ExternalLink size={14} color={C.text} />}
                  />
                ) : null}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
