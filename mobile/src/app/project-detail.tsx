import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Package,
  FileCode,
  Activity,
  Eye,
  Trash2,
  Check,
  X,
  Edit3,
  Upload,
  Sparkles,
  Code2,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { api } from "@/lib/api/api";
import { C } from "@/theme/colors";
import { cn } from "@/lib/cn";
import { Tag } from "@/components/ui/Tag";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CodeViewer } from "@/components/CodeViewer";
import { FileTree } from "@/components/FileTree";
import { Dialog } from "@/components/ui/Dialog";
import { useToastStore } from "@/lib/state/toast-store";
import type { Project, Run, FileItem, ZipUploadResponse, GenerateResponse } from "@/lib/types";

// --- Helpers ---

function getProviderInfo(model: string): { name: string; color: string } {
  if (model.includes("claude")) return { name: "Claude", color: "#D4A574" };
  if (model.includes("gpt") || model.includes("openai"))
    return { name: "OpenAI", color: "#74AA9C" };
  if (model.includes("gemini")) return { name: "Gemini", color: "#4285F4" };
  return { name: "AI", color: "#999" };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStatusColor(status: string): string {
  if (status === "done" || status === "completed") return C.green;
  if (status === "error" || status === "failed") return C.red;
  if (status === "running" || status === "pending") return C.warn;
  return C.dim;
}

// --- Main Screen ---

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const [notes, setNotes] = useState<string>("");
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const {
    data: project,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });

  // Sync notes from project once loaded
  useEffect(() => {
    if (project && !notesLoaded) {
      setNotes(project.notes ?? "");
      setNotesLoaded(true);
    }
  }, [project, notesLoaded]);

  // Update notes mutation
  const { mutate: updateNotes } = useMutation({
    mutationFn: (newNotes: string) => {
      if (!id) throw new Error("No project ID");
      return api.put<Project>(`/api/projects/${id}`, { notes: newNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      showToast("Notes saved");
    },
    onError: () => {
      showToast("Failed to save notes");
    },
  });

  // Delete mutation
  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: () => {
      if (!id) throw new Error("No project ID");
      return api.delete<void>(`/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      showToast("Project deleted");
      router.back();
    },
    onError: () => {
      showToast("Failed to delete project");
    },
  });

  const handleNotesBlur = useCallback(() => {
    if (project && notes !== (project.notes ?? "")) {
      updateNotes(notes);
    }
  }, [project, notes, updateNotes]);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(false);
    deleteProject();
  }, [deleteProject]);

  const handleZipUpload = useCallback(async () => {
    if (!id) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      if (!file.name?.endsWith(".zip")) {
        showToast("Please select a .zip file");
        return;
      }

      setIsUploadingZip(true);

      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? "application/zip",
      } as unknown as Blob);

      const response = await api.upload<ZipUploadResponse>(
        `/api/projects/${id}/upload-zip`,
        formData
      );

      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      const fileCount = response?.extracted?.fileCount ?? 0;
      const hasSpec = response?.extracted?.hasVfApp ?? false;
      showToast(`Imported ${fileCount} files${hasSpec ? " + VF_APP spec" : ""}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import zip";
      showToast(msg);
    } finally {
      setIsUploadingZip(false);
    }
  }, [id, showToast, queryClient]);

  const handleAnalyzeZip = useCallback(async () => {
    if (!id) return;
    setIsAnalyzing(true);
    try {
      await api.post<GenerateResponse>(`/api/projects/${id}/analyze-zip`, {});
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      showToast("Preview generated! Open the Preview tab.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      showToast(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [id, showToast, queryClient]);

  // Parse files from project JSON string
  const parsedFiles = useMemo(() => {
    if (!project?.files) return [];
    try {
      const files: FileItem[] =
        typeof project.files === "string"
          ? JSON.parse(project.files)
          : (project.files as unknown as FileItem[]);
      return files.map((f, i) => ({
        id: String(i),
        path: f.path,
        content: f.content,
      }));
    } catch {
      return [];
    }
  }, [project?.files]);

  const runs = project?.runs ?? [];

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg items-center justify-center">
        <ActivityIndicator size="large" color={C.cy} />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView className="flex-1 bg-vf-bg items-center justify-center">
        <Text
          className="text-vf-dim text-sm"
          style={{ fontFamily: "monospace" }}
        >
          Project not found
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text
            className="text-vf-cyan text-sm"
            style={{ fontFamily: "monospace" }}
          >
            Go Back
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
      {/* Top Bar */}
      <View className="flex-row items-center px-4 py-3 border-b border-vf-b1">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 items-center justify-center rounded-lg bg-vf-s2 mr-3"
          hitSlop={8}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <ArrowLeft size={18} color={C.text} />
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-vf-text text-base"
            style={{ fontFamily: "monospace" }}
            numberOfLines={1}
          >
            {project.name}
          </Text>
          <Text
            className="text-vf-dim text-xs"
            style={{ fontFamily: "monospace" }}
          >
            {project.bundleId}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.cy}
          />
        }
      >
        {/* Status Tags */}
        <View className="flex-row flex-wrap mt-4 mb-4" style={{ gap: 6 }}>
          <Tag
            label={project.vfAppSpec ? "VF_APP" : "No Spec"}
            color={project.vfAppSpec ? C.green : C.dim}
          />
          <Tag
            label={
              parsedFiles.length > 0
                ? `${parsedFiles.length} files`
                : "No files"
            }
            color={parsedFiles.length > 0 ? C.mg : C.dim}
          />
          <Tag
            label={`${runs.length} runs`}
            color={runs.length > 0 ? C.cy : C.dim}
          />
          <Tag label={project.previewState} color={C.mid} />
        </View>

        {/* Notes Section */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Edit3 size={14} color={C.cy} />
            <Text
              className="text-vf-cyan text-xs uppercase tracking-widest ml-2"
              style={{ fontFamily: "monospace" }}
            >
              Notes
            </Text>
          </View>
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Add project notes..."
            multiline
            rows={4}
          />
          <Pressable
            onPress={handleNotesBlur}
            className="self-end mt-2 px-3 py-1.5 rounded-lg bg-vf-s2 border border-vf-b1"
          >
            <Text
              className="text-vf-cyan text-xs"
              style={{ fontFamily: "monospace" }}
            >
              Save Notes
            </Text>
          </Pressable>
        </View>

        {/* Files Section */}
        {parsedFiles.length > 0 ? (
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <FileCode size={14} color={C.mg} />
              <Text
                className="text-vf-magenta text-xs uppercase tracking-widest ml-2"
                style={{ fontFamily: "monospace" }}
              >
                Files
              </Text>
            </View>
            <FileTree files={parsedFiles} projectName={project.name} />
          </View>
        ) : null}

        {/* VF_APP Spec Section */}
        {project.vfAppSpec ? (
          <View className="mb-5">
            <View className="flex-row items-center mb-2">
              <Package size={14} color={C.green} />
              <Text
                className="text-vf-green text-xs uppercase tracking-widest ml-2"
                style={{ fontFamily: "monospace" }}
              >
                VF_APP Spec
              </Text>
            </View>
            <CodeViewer
              code={project.vfAppSpec}
              filename="VF_APP.json"
              language="json"
            />
          </View>
        ) : null}

        {/* Runs Section */}
        <View className="mb-5">
          <View className="flex-row items-center mb-2">
            <Activity size={14} color={C.cy} />
            <Text
              className="text-vf-cyan text-xs uppercase tracking-widest ml-2"
              style={{ fontFamily: "monospace" }}
            >
              Recent Runs ({runs.length})
            </Text>
          </View>
          {runs.length > 0 ? (
            runs.slice(0, 10).map((run) => (
              <RunRow key={run.id} run={run} />
            ))
          ) : (
            <Box>
              <Text
                className="text-vf-dim text-xs text-center"
                style={{ fontFamily: "monospace" }}
              >
                No runs for this project yet
              </Text>
            </Box>
          )}
        </View>

        {/* Actions */}
        <View className="space-y-3 mb-4">
          <Button
            label="OPEN IDE"
            onPress={() => router.push({ pathname: "/project-ide", params: { id } })}
            variant="secondary"
            icon={<Code2 size={16} color="#000" />}
          />
          <View className="mt-2">
            <Button
              label={isUploadingZip ? "IMPORTING..." : "IMPORT ZIP"}
              onPress={handleZipUpload}
              variant="primary"
              icon={<Upload size={16} color="#000" />}
              loading={isUploadingZip}
            />
          </View>
          {parsedFiles.length > 0 && !project.vfAppSpec ? (
            <View className="mt-2">
              <Button
                label={isAnalyzing ? "ANALYZING..." : "ANALYZE WITH AI"}
                onPress={handleAnalyzeZip}
                variant="secondary"
                icon={<Sparkles size={16} color={C.cy} />}
                loading={isAnalyzing}
              />
              <Text
                className="text-vf-dim text-xs text-center mt-1"
                style={{ fontFamily: "monospace" }}
              >
                Uses your configured AI to generate an interactive preview
              </Text>
            </View>
          ) : null}
          <View className="mt-2">
            <Button
              label="Preview"
              onPress={() => router.push("/(tabs)" as any)}
              variant="secondary"
              icon={<Eye size={16} color="#000" />}
            />
          </View>
        </View>
        <View className="mt-3">
          <Button
            label="Delete Project"
            onPress={() => setShowDeleteDialog(true)}
            variant="danger"
            icon={<Trash2 size={16} color="#fff" />}
            loading={isDeleting}
          />
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Project"
      >
        <Text
          className="text-vf-text text-sm mb-4"
          style={{ fontFamily: "monospace" }}
        >
          Are you sure you want to delete "{project.name}"? This action cannot
          be undone.
        </Text>
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Button
              label="Cancel"
              onPress={() => setShowDeleteDialog(false)}
              variant="ghost"
              icon={<X size={14} color={C.text} />}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Delete"
              onPress={handleDelete}
              variant="danger"
              icon={<Trash2 size={14} color="#fff" />}
            />
          </View>
        </View>
      </Dialog>
    </SafeAreaView>
  );
}

// --- Run Row for project detail ---

function RunRow({ run }: { run: Run }) {
  const provider = getProviderInfo(run.inputModel);
  const statusColor = getStatusColor(run.status);

  return (
    <Box className="mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColor,
            }}
          />
          <Text
            className="text-vf-text text-xs ml-2"
            style={{ fontFamily: "monospace" }}
          >
            {run.status}
          </Text>
        </View>
        <Text
          className="text-vf-dim text-xs"
          style={{ fontFamily: "monospace" }}
        >
          {formatTime(run.createdAt)}
        </Text>
      </View>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        <Tag label={provider.name} color={provider.color} />
        {run.parseFileCount > 0 ? (
          <Tag label={`${run.parseFileCount} files`} color={C.mg} />
        ) : null}
        {run.error ? <Tag label="error" color={C.red} /> : null}
      </View>
    </Box>
  );
}
