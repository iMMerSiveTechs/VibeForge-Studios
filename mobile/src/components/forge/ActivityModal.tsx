import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Activity,
  Search,
  Cpu,
  FileCode,
  ChevronRight,
  Circle,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Dialog } from "@/components/ui/Dialog";
import { Tag } from "@/components/ui/Tag";
import {
  getProviderInfo,
  getRunCost,
  formatTime,
  formatTokens,
  getStatusColor,
} from "@/lib/runs-utils";
import type { Run } from "@/lib/types";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityModal({ isOpen, onClose }: ActivityModalProps) {
  const [search, setSearch] = useState("");
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const showToast = useToastStore((s) => s.show);

  const { data: runs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["runs"],
    queryFn: () => api.get<Run[]>("/api/runs"),
  });

  const filteredRuns = useMemo(() => {
    if (!runs) return [];
    return runs.filter((run) => {
      const searchLower = search.toLowerCase();
      const projectName = run.project?.name ?? "";
      const provider = getProviderInfo(run.inputModel).name;
      return (
        projectName.toLowerCase().includes(searchLower) ||
        provider.toLowerCase().includes(searchLower)
      );
    });
  }, [runs, search]);

  const totalCost = useMemo(
    () => (runs ?? []).reduce((sum, run) => sum + getRunCost(run), 0),
    [runs]
  );

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: C.b1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Activity size={16} color={C.green} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: C.text,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              ACTIVITY
            </Text>
            {runs ? (
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: C.mid + "30",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: C.dim,
                    fontFamily: "monospace",
                    fontWeight: "700",
                  }}
                >
                  {runs.length}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={C.dim} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 10,
              height: 36,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: C.b1,
              backgroundColor: C.s1,
            }}
          >
            <Search size={14} color={C.dim} />
            <TextInput
              placeholder="Search project or provider…"
              placeholderTextColor={C.dim}
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                color: C.text,
                fontFamily: "monospace",
                fontSize: 12,
              }}
            />
          </View>
        </View>

        {/* Cost Summary */}
        {totalCost > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
            <Text style={{ color: C.dim, fontSize: 10, fontFamily: "monospace" }}>
              Total Cost: ${totalCost.toFixed(4)}
            </Text>
          </View>
        ) : null}

        {/* Runs List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={C.cy} />
          </View>
        ) : (filteredRuns ?? []).length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <FileCode size={32} color={C.b1} />
            <Text style={{ color: C.dim, fontSize: 12, fontFamily: "monospace", marginTop: 8 }}>
              {search ? "No runs match filter" : "No runs yet"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRuns}
            keyExtractor={(run) => run.id}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
            }
            renderItem={({ item: run }) => {
              const provider = getProviderInfo(run.inputModel);
              const statusColor = getStatusColor(run.status);
              return (
                <Pressable
                  onPress={() => setSelectedRun(run)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: C.b1,
                    gap: 10,
                  }}
                >
                  <Circle size={8} color={statusColor} fill={statusColor} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: C.text,
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: "600",
                      }}
                    >
                      {run.project?.name ?? "Untitled"}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        marginTop: 4,
                      }}
                    >
                      <Tag label={provider.name} color={provider.color} />
                      <Text style={{ color: C.dim, fontSize: 10, fontFamily: "monospace" }}>
                        {formatTime(run.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text
                      style={{
                        color: C.green,
                        fontFamily: "monospace",
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      {run.parseFileCount} files
                    </Text>
                    <Text style={{ color: C.dim, fontSize: 10, fontFamily: "monospace" }}>
                      {formatTokens(
                        (run.usageInputTokens ?? 0) + (run.usageOutputTokens ?? 0)
                      )}{" "}
                      tokens
                    </Text>
                  </View>
                  <ChevronRight size={14} color={C.dim} />
                </Pressable>
              );
            }}
          />
        )}

        {/* Detail Modal */}
        <Dialog
          open={selectedRun !== null}
          title={selectedRun ? `${selectedRun.project?.name ?? "Run"} — Details` : "Details"}
          onClose={() => setSelectedRun(null)}
        >
          {selectedRun ? (
            <View style={{ paddingHorizontal: 16 }}>
              <DetailRow label="Status" value={selectedRun.status} />
              <DetailRow label="Model" value={selectedRun.inputModel} />
              <DetailRow
                label="Input Tokens"
                value={formatTokens(selectedRun.usageInputTokens)}
              />
              <DetailRow
                label="Output Tokens"
                value={formatTokens(selectedRun.usageOutputTokens)}
              />
              <DetailRow
                label="Cost"
                value={`$${getRunCost(selectedRun).toFixed(4)}`}
              />
              {selectedRun.parseHasVfApp ? (
                <View style={{ marginVertical: 8 }}>
                  <Tag label="VF_APP" color={C.green} />
                </View>
              ) : null}
              {selectedRun.parseHasVfPack ? (
                <View style={{ marginVertical: 8 }}>
                  <Tag label="VF_PACK" color={C.cy} />
                </View>
              ) : null}
              {selectedRun.error ? (
                <Text style={{ color: C.red, fontSize: 11, fontFamily: "monospace", marginTop: 8 }}>
                  Error: {selectedRun.error}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Dialog>
      </SafeAreaView>
    </Modal>
  );
}

// Helper component
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: C.b1,
      }}
    >
      <Text style={{ color: C.dim, fontSize: 11, fontFamily: "monospace" }}>
        {label}
      </Text>
      <Text style={{ color: C.text, fontSize: 11, fontFamily: "monospace", fontWeight: "600" }}>
        {value}
      </Text>
    </View>
  );
}
