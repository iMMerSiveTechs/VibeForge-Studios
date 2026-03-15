import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zap, Plus, Trash2, ChevronRight, Upload, Search, X } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import { api } from "@/lib/api/api";
import { C } from "@/theme/colors";
import { cn } from "@/lib/cn";
import { useToastStore } from "@/lib/state/toast-store";
import { useProjectStore } from "@/lib/state/project-store";
import { Button } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";
import { Tag } from "@/components/ui/Tag";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import type { Project, ZipUploadResponse } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${mins}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "running":
      return C.cy;
    case "done":
      return C.green;
    case "error":
      return C.red;
    default:
      return C.dim;
  }
}

function ProjectCard({
  project,
  onDelete,
  onTap,
  isDeleting,
}: {
  project: Project;
  onDelete: () => void;
  onTap: () => void;
  isDeleting: boolean;
}) {
  return (
    <Box className="mb-3" onPress={onTap}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text
            className="text-vf-text text-base mb-1"
            style={{ fontFamily: "monospace", fontWeight: "bold" }}
            numberOfLines={1}
          >
            {project.name}
          </Text>
          <Text
            className="text-vf-dim text-xs mb-2"
            style={{ fontFamily: "monospace" }}
            numberOfLines={1}
          >
            {project.bundleId}
          </Text>
          <View className="flex-row items-center space-x-2">
            <Tag
              label={project.previewState || "idle"}
              color={getStatusColor(project.previewState)}
            />
            <Text
              className="text-vf-dim text-xs ml-2"
              style={{ fontFamily: "monospace" }}
            >
              {formatDate(project.updatedAt)}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-1">
          <Pressable
            onPress={onDelete}
            disabled={isDeleting}
            className="w-9 h-9 items-center justify-center rounded-lg bg-vf-s2 active:opacity-60"
            hitSlop={4}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={C.red} />
            ) : (
              <Trash2 size={16} color={C.red} />
            )}
          </Pressable>
          <View className="w-8 h-9 items-center justify-center">
            <ChevronRight size={16} color={C.dim} />
          </View>
        </View>
      </View>
    </Box>
  );
}

export default function ProjectsScreen() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [zipDialogOpen, setZipDialogOpen] = useState(false);
  const [zipProjectName, setZipProjectName] = useState("");
  const [zipTargetProject, setZipTargetProject] = useState<Project | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);

  const {
    data: projects,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/projects"),
  });

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.bundleId.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: (name: string) =>
      api.post<Project>("/api/projects", { name }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDialogOpen(false);
      setNewName("");
      showToast(`Project "${project.name}" created`);
    },
    onError: () => {
      showToast("Failed to create project");
    },
  });

  const { mutate: deleteProject } = useMutation({
    mutationFn: (id: string) => api.delete<Project>(`/api/projects/${id}`),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      showToast("Project deleted");
    },
    onError: () => {
      showToast("Failed to delete project");
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleCreate = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createProject(trimmed);
  }, [newName, createProject]);

  const handleZipImport = useCallback(async () => {
    try {
      // Step 1: Pick the zip file
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/zip", "application/x-zip-compressed", "application/octet-stream"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];

      // Verify it's a zip
      if (!file.name?.endsWith(".zip")) {
        showToast("Please select a .zip file");
        return;
      }

      // Verify we have a valid URI
      if (!file.uri || file.uri.trim() === "") {
        showToast("Invalid file URI");
        return;
      }

      // Step 2: Determine which project to upload to
      let targetId: string | null = null;

      if (zipTargetProject) {
        targetId = zipTargetProject.id;
      } else if (zipProjectName.trim()) {
        try {
          const newProject = await api.post<Project>("/api/projects", {
            name: zipProjectName.trim(),
          });
          targetId = newProject.id;
        } catch {
          showToast("Failed to create project");
          return;
        }
      } else {
        showToast("Enter a project name or select existing");
        return;
      }

      setIsUploading(true);
      setZipDialogOpen(false);

      // Step 3: Upload the zip file
      const formData = new FormData();
      // React Native FormData accepts a specific file object format
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? "application/zip",
      } as any);

      const response = await api.upload<ZipUploadResponse>(
        `/api/projects/${targetId}/upload-zip`,
        formData
      );

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", targetId] });

      setActiveProjectId(targetId);

      const fileCount = response?.extracted?.fileCount ?? 0;
      const hasSpec = response?.extracted?.hasVfApp ?? false;

      showToast(
        hasSpec
          ? `Imported ${fileCount} files + VF_APP spec`
          : `Imported ${fileCount} files — open project to analyze with AI`
      );

      // Navigate to the project detail
      router.push({ pathname: "/project-detail", params: { id: targetId } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to import zip";
      showToast(msg);
    } finally {
      setIsUploading(false);
      setZipProjectName("");
      setZipTargetProject(null);
    }
  }, [zipTargetProject, zipProjectName, showToast, queryClient, setActiveProjectId, router]);

  const renderItem = useCallback(
    ({ item }: { item: Project }) => (
      <ProjectCard
        project={item}
        onDelete={() => deleteProject(item.id)}
        onTap={() => {
          setActiveProjectId(item.id);
          router.push({ pathname: "/project-detail", params: { id: item.id } });
        }}
        isDeleting={deletingId === item.id}
      />
    ),
    [deleteProject, deletingId, setActiveProjectId, router]
  );

  const keyExtractor = useCallback((item: Project) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
      {/* Header */}
      <View className="px-5 pt-3 pb-4">
        <View
          style={{
            shadowColor: C.cy,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center mb-1">
            <View
              className="w-8 h-8 rounded-lg items-center justify-center mr-3"
              style={{ backgroundColor: C.cy + "20" }}
            >
              <Zap size={18} color={C.cy} />
            </View>
            <View>
              <Text
                className="text-vf-text text-lg tracking-widest"
                style={{ fontFamily: "monospace", fontWeight: "bold" }}
              >
                VIBEFORGE STUDIO
              </Text>
              <Text
                className="text-vf-dim text-xs tracking-wider"
                style={{ fontFamily: "monospace" }}
              >
                Black Anvil v1.0
              </Text>
            </View>
          </View>
        </View>

        {/* Separator line with glow */}
        <View
          className="h-px mt-3"
          style={{
            backgroundColor: C.cy + "30",
            shadowColor: C.cy,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </View>

      {/* Search bar */}
      <View className="px-5 pb-3">
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.s1,
            borderWidth: 1,
            borderColor: C.b1,
            borderRadius: 10,
            paddingHorizontal: 12,
          }}
        >
          <Search size={14} color={C.dim} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search projects..."
            placeholderTextColor={C.dim}
            style={{
              flex: 1,
              color: C.text,
              fontSize: 13,
              fontFamily: "monospace",
              paddingVertical: 10,
              paddingHorizontal: 8,
            }}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <X size={14} color={C.dim} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Action bar */}
      <View className="px-5 pb-3 flex-row" style={{ gap: 10 }}>
        <View className="flex-1">
          <Button
            label="NEW PROJECT"
            onPress={() => setDialogOpen(true)}
            variant="secondary"
            icon={<Plus size={14} color="#000" />}
            small
          />
        </View>
        <View className="flex-1">
          <Button
            label={isUploading ? "IMPORTING..." : "IMPORT ZIP"}
            onPress={() => setZipDialogOpen(true)}
            variant="accent"
            icon={<Upload size={14} color="#000" />}
            small
            loading={isUploading}
          />
        </View>
      </View>

      {/* Project list */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={C.cy} />
          <Text
            className="text-vf-dim text-xs mt-3"
            style={{ fontFamily: "monospace" }}
          >
            Loading projects...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProjects}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={C.cy}
              colors={[C.cy]}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <View
                className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
                style={{ backgroundColor: C.dim + "15" }}
              >
                <Zap size={28} color={C.dim} />
              </View>
              <Text
                className="text-vf-dim text-sm text-center"
                style={{ fontFamily: "monospace" }}
              >
                No projects yet.
              </Text>
              <Text
                className="text-vf-dim text-xs text-center mt-1"
                style={{ fontFamily: "monospace" }}
              >
                Tap New to start forging.
              </Text>
            </View>
          }
        />
      )}

      {/* New Project Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setNewName("");
        }}
        title="New Project"
      >
        <View className="space-y-4">
          <Input
            label="Project Name"
            value={newName}
            onChangeText={setNewName}
            placeholder="my-awesome-app"
          />
          <View className="mt-4 flex-row space-x-3">
            <View className="flex-1">
              <Button
                label="CANCEL"
                onPress={() => {
                  setDialogOpen(false);
                  setNewName("");
                }}
                variant="ghost"
              />
            </View>
            <View className="flex-1">
              <Button
                label="CREATE"
                onPress={handleCreate}
                variant="primary"
                loading={isCreating}
                disabled={!newName.trim()}
              />
            </View>
          </View>
        </View>
      </Dialog>

      {/* Zip Import Dialog */}
      <Dialog
        open={zipDialogOpen}
        onClose={() => {
          setZipDialogOpen(false);
          setZipProjectName("");
          setZipTargetProject(null);
        }}
        title="Import Zip"
      >
        <View>
          <Text
            className="text-vf-dim text-xs mb-4"
            style={{ fontFamily: "monospace" }}
          >
            Upload a .zip file to extract files into a project. If the zip contains
            a VF_APP spec JSON, it will be auto-detected for preview.
          </Text>

          {/* Option 1: New project */}
          <Text
            className="text-vf-cyan text-xs uppercase tracking-widest mb-2"
            style={{ fontFamily: "monospace" }}
          >
            New Project
          </Text>
          <Input
            value={zipProjectName}
            onChangeText={(v) => {
              setZipProjectName(v);
              setZipTargetProject(null);
            }}
            placeholder="Enter project name..."
          />

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px" style={{ backgroundColor: C.b1 }} />
            <Text
              className="text-vf-dim text-xs mx-3"
              style={{ fontFamily: "monospace" }}
            >
              OR
            </Text>
            <View className="flex-1 h-px" style={{ backgroundColor: C.b1 }} />
          </View>

          {/* Option 2: Existing project */}
          <Text
            className="text-vf-cyan text-xs uppercase tracking-widest mb-2"
            style={{ fontFamily: "monospace" }}
          >
            Existing Project
          </Text>
          {projects && projects.length > 0 ? (
            <ScrollView style={{ maxHeight: 160 }} showsVerticalScrollIndicator={true}>
              {projects.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setZipTargetProject(p);
                    setZipProjectName("");
                  }}
                  className={cn(
                    "px-3 py-2.5 rounded-lg mb-1.5 border",
                    zipTargetProject?.id === p.id
                      ? "border-vf-green bg-vf-green/10"
                      : "border-vf-b1 bg-vf-s2"
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs",
                      zipTargetProject?.id === p.id
                        ? "text-vf-green"
                        : "text-vf-text"
                    )}
                    style={{ fontFamily: "monospace" }}
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text
              className="text-vf-dim text-xs text-center py-3"
              style={{ fontFamily: "monospace" }}
            >
              No existing projects
            </Text>
          )}

          {/* Upload button */}
          <View className="mt-4">
            <Button
              label="SELECT ZIP & IMPORT"
              onPress={handleZipImport}
              variant="primary"
              icon={<Upload size={14} color="#000" />}
              disabled={(!zipProjectName.trim() && !zipTargetProject) || isUploading}
              loading={isUploading}
            />
          </View>
        </View>
      </Dialog>
    </SafeAreaView>
  );
}
