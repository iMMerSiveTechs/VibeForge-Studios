import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw, Clock, FileCode } from "lucide-react-native";
import { api } from "@/lib/api/api";
import { useToastStore } from "@/lib/state/toast-store";

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
  error: "#FF6B6B",
  success: "#68D391",
};

interface Snapshot {
  id: string;
  description: string;
  createdAt: string;
  fileCount: number;
}

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProjectHistoryScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const {
    data: snapshots,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["snapshots", projectId],
    queryFn: () =>
      api.get<Snapshot[]>(`/api/projects/${projectId}/snapshots`),
    enabled: !!projectId,
  });

  const { mutate: restoreSnapshot, isPending: isRestoring } = useMutation({
    mutationFn: (snapshotId: string) =>
      api.post<void>(
        `/api/projects/${projectId}/snapshots/${snapshotId}/restore`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["snapshots", projectId] });
      showToast("Snapshot restored successfully");
    },
    onError: (err) => {
      showToast(
        err instanceof Error ? err.message : "Failed to restore snapshot"
      );
    },
  });

  const renderItem = ({ item, index }: { item: Snapshot; index: number }) => (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: 16,
        marginBottom: 12,
      }}
    >
      {/* Timeline line */}
      <View style={{ width: 32, alignItems: "center" }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: index === 0 ? COLORS.cyan : COLORS.dimmer,
            borderWidth: 2,
            borderColor: index === 0 ? COLORS.cyan : COLORS.dim,
            marginTop: 6,
          }}
        />
        {index < (snapshots?.length ?? 0) - 1 ? (
          <View
            style={{
              width: 1,
              flex: 1,
              backgroundColor: COLORS.dimmer,
              marginTop: 4,
            }}
          />
        ) : null}
      </View>

      {/* Content card */}
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.surface,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: COLORS.dimmer,
          padding: 14,
          marginLeft: 10,
        }}
      >
        <Text
          style={{
            color: COLORS.text,
            fontSize: 13,
            fontFamily: "monospace",
            marginBottom: 8,
            lineHeight: 18,
          }}
          numberOfLines={3}
        >
          {item.description}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Clock size={11} color={COLORS.dim} />
              <Text
                style={{
                  color: COLORS.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <FileCode size={11} color={COLORS.dim} />
              <Text
                style={{
                  color: COLORS.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {item.fileCount} {item.fileCount === 1 ? "file" : "files"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => restoreSnapshot(item.id)}
            disabled={isRestoring}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: pressed
                ? COLORS.violet
                : COLORS.surfaceHigh,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: COLORS.violet,
              opacity: isRestoring ? 0.5 : 1,
            })}
          >
            <RotateCcw size={12} color={COLORS.lilac} />
            <Text
              style={{
                color: COLORS.lilac,
                fontSize: 11,
                fontFamily: "monospace",
                fontWeight: "600",
              }}
            >
              Restore
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      <Stack.Screen options={{ title: "History", headerShown: false }} />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.dimmer,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            backgroundColor: COLORS.surface,
            marginRight: 12,
          }}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={18} color={COLORS.text} />
        </Pressable>
        <Text
          style={{
            color: COLORS.text,
            fontSize: 17,
            fontFamily: "monospace",
            fontWeight: "600",
          }}
        >
          History
        </Text>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={COLORS.cyan} />
        </View>
      ) : !snapshots || snapshots.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Clock size={40} color={COLORS.dimmer} />
          <Text
            style={{
              color: COLORS.dim,
              fontSize: 13,
              fontFamily: "monospace",
              textAlign: "center",
              marginTop: 16,
              lineHeight: 20,
            }}
          >
            No snapshots yet. Snapshots are created automatically when you
            generate code.
          </Text>
        </View>
      ) : (
        <FlatList
          data={snapshots}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
          onRefresh={refetch}
          refreshing={isRefetching}
        />
      )}
    </SafeAreaView>
  );
}
