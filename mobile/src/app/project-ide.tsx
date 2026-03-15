import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  X,
} from "lucide-react-native";
import { api } from "@/lib/api/api";
import { C } from "@/theme/colors";
import { FileExplorer } from "@/components/ide/FileExplorer";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToastStore } from "@/lib/state/toast-store";
import type { Project, FileItem } from "@/lib/types";

const SIDEBAR_WIDTH = 220;

export default function ProjectIDEScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [createDialogType, setCreateDialogType] = useState<
    "file" | "folder" | null
  >(null);
  const [newItemName, setNewItemName] = useState("");
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Fetch project
  const {
    data: project,
    isLoading,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.get<Project>(`/api/projects/${id}`),
    enabled: !!id,
  });

  // Parse files
  const parsedFiles = useMemo(() => {
    if (!project?.files) return [];
    try {
      const files: FileItem[] =
        typeof project.files === "string"
          ? JSON.parse(project.files)
          : (project.files as unknown as FileItem[]);
      return files;
    } catch {
      return [];
    }
  }, [project?.files]);

  // Get current file content
  const currentFile = useMemo(
    () => parsedFiles.find((f) => f.path === selectedPath),
    [parsedFiles, selectedPath]
  );

  // Save file mutation
  const { mutate: saveFile, isPending: isSaving } = useMutation({
    mutationFn: (params: { path: string; content: string }) => {
      if (!id) throw new Error("No project ID");
      return api.put<{ path: string; content: string }>(
        `/api/projects/${id}/file`,
        params
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      showToast("File saved");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to save");
    },
  });

  // Create file mutation
  const { mutate: createFile, isPending: isCreating } = useMutation({
    mutationFn: (params: { path: string; content: string }) => {
      if (!id) throw new Error("No project ID");
      return api.put<{ path: string; content: string }>(
        `/api/projects/${id}/file`,
        params
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      setSelectedPath(variables.path);
      setCreateDialogType(null);
      setNewItemName("");
      showToast("File created");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to create");
    },
  });

  // Rename mutation
  const { mutate: renameFile, isPending: isRenaming } = useMutation({
    mutationFn: (params: { oldPath: string; newPath: string }) => {
      if (!id) throw new Error("No project ID");
      return api.post<{ renamed: number }>(
        `/api/projects/${id}/file/rename`,
        params
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      if (selectedPath === variables.oldPath) {
        setSelectedPath(variables.newPath);
      }
      setRenameTarget(null);
      setRenameName("");
      showToast("Renamed");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to rename");
    },
  });

  // Delete mutation
  const { mutate: deleteFile, isPending: isDeleting } = useMutation({
    mutationFn: (path: string) => {
      if (!id) throw new Error("No project ID");
      return api.delete<{ deleted: number }>(
        `/api/projects/${id}/file?path=${encodeURIComponent(path)}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      if (selectedPath === deleteTarget) {
        setSelectedPath(null);
      }
      setDeleteTarget(null);
      showToast("Deleted");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  // Handlers
  const handleSaveFile = useCallback(
    (content: string) => {
      if (!selectedPath) return;
      saveFile({ path: selectedPath, content });
    },
    [selectedPath, saveFile]
  );

  const handleCreateFile = useCallback(() => {
    if (!newItemName.trim()) return;
    const path =
      createDialogType === "folder"
        ? `${newItemName.trim()}/.gitkeep`
        : newItemName.trim();
    createFile({ path, content: createDialogType === "folder" ? "" : "" });
  }, [newItemName, createDialogType, createFile]);

  const handleRename = useCallback(() => {
    if (!renameTarget || !renameName.trim()) return;
    renameFile({ oldPath: renameTarget, newPath: renameName.trim() });
  }, [renameTarget, renameName, renameFile]);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteFile(deleteTarget);
  }, [deleteTarget, deleteFile]);

  const openRenameDialog = useCallback((path: string) => {
    setRenameTarget(path);
    setRenameName(path);
  }, []);

  const openDeleteDialog = useCallback((path: string) => {
    setDeleteTarget(path);
  }, []);

  // Loading state
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-vf-bg" edges={["top"]}>
      {/* Top Bar */}
      <View className="flex-row items-center px-3 py-2 border-b border-vf-b1 bg-vf-s1">
        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 items-center justify-center rounded-lg bg-vf-s2 mr-2"
          hitSlop={8}
        >
          <ArrowLeft size={16} color={C.text} />
        </Pressable>

        <Pressable
          onPress={() => setSidebarOpen(!sidebarOpen)}
          className="w-8 h-8 items-center justify-center rounded-lg bg-vf-s2 mr-2"
          hitSlop={8}
        >
          {sidebarOpen ? (
            <PanelLeftClose size={16} color={C.cy} />
          ) : (
            <PanelLeftOpen size={16} color={C.mid} />
          )}
        </Pressable>

        <View className="flex-1">
          <Text
            className="text-vf-text text-sm"
            style={{ fontFamily: "monospace" }}
            numberOfLines={1}
          >
            {project.name}
          </Text>
        </View>

        <View className="flex-row items-center" style={{ gap: 4 }}>
          <Text
            className="text-vf-dim text-xs"
            style={{ fontFamily: "monospace" }}
          >
            {parsedFiles.length} files
          </Text>
        </View>
      </View>

      {/* Main IDE area */}
      <View className="flex-1 flex-row">
        {/* Sidebar */}
        {sidebarOpen ? (
          <View style={{ width: SIDEBAR_WIDTH }}>
            <FileExplorer
              files={parsedFiles}
              selectedPath={selectedPath}
              onSelectFile={setSelectedPath}
              onCreateFile={() => setCreateDialogType("file")}
              onCreateFolder={() => setCreateDialogType("folder")}
              onDeleteFile={openDeleteDialog}
              onRenameFile={openRenameDialog}
              projectName={project.name}
            />
          </View>
        ) : null}

        {/* Editor */}
        <View className="flex-1">
          {currentFile ? (
            <CodeEditor
              filePath={currentFile.path}
              content={currentFile.content}
              onSave={handleSaveFile}
              isSaving={isSaving}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-black">
              <Text
                className="text-vf-dim text-sm"
                style={{ fontFamily: "monospace" }}
              >
                {parsedFiles.length > 0
                  ? "Select a file to edit"
                  : "No files yet"}
              </Text>
              {parsedFiles.length === 0 ? (
                <Pressable
                  onPress={() => setCreateDialogType("file")}
                  className="mt-4 flex-row items-center px-4 py-2 rounded-lg bg-vf-s2 border border-vf-b1"
                >
                  <Plus size={14} color={C.cy} />
                  <Text
                    className="text-vf-cyan text-xs ml-2"
                    style={{ fontFamily: "monospace" }}
                  >
                    Create First File
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {/* Create File/Folder Dialog */}
      <Dialog
        open={createDialogType !== null}
        onClose={() => {
          setCreateDialogType(null);
          setNewItemName("");
        }}
        title={createDialogType === "folder" ? "New Folder" : "New File"}
      >
        <Input
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder={
            createDialogType === "folder"
              ? "src/components"
              : "src/components/MyComponent.tsx"
          }
          label={createDialogType === "folder" ? "Folder path" : "File path"}
        />
        <View className="flex-row mt-4" style={{ gap: 8 }}>
          <View className="flex-1">
            <Button
              label="Cancel"
              onPress={() => {
                setCreateDialogType(null);
                setNewItemName("");
              }}
              variant="ghost"
            />
          </View>
          <View className="flex-1">
            <Button
              label="Create"
              onPress={handleCreateFile}
              variant="primary"
              loading={isCreating}
              disabled={!newItemName.trim()}
            />
          </View>
        </View>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={renameTarget !== null}
        onClose={() => {
          setRenameTarget(null);
          setRenameName("");
        }}
        title="Rename"
      >
        <Input
          value={renameName}
          onChangeText={setRenameName}
          placeholder="New path"
          label="New path"
        />
        <View className="flex-row mt-4" style={{ gap: 8 }}>
          <View className="flex-1">
            <Button
              label="Cancel"
              onPress={() => {
                setRenameTarget(null);
                setRenameName("");
              }}
              variant="ghost"
            />
          </View>
          <View className="flex-1">
            <Button
              label="Rename"
              onPress={handleRename}
              variant="secondary"
              loading={isRenaming}
              disabled={!renameName.trim() || renameName === renameTarget}
            />
          </View>
        </View>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete File"
      >
        <Text
          className="text-vf-text text-sm mb-4"
          style={{ fontFamily: "monospace" }}
        >
          Delete "{deleteTarget}"? This cannot be undone.
        </Text>
        <View className="flex-row" style={{ gap: 8 }}>
          <View className="flex-1">
            <Button
              label="Cancel"
              onPress={() => setDeleteTarget(null)}
              variant="ghost"
            />
          </View>
          <View className="flex-1">
            <Button
              label="Delete"
              onPress={handleDelete}
              variant="danger"
              loading={isDeleting}
            />
          </View>
        </View>
      </Dialog>
    </SafeAreaView>
  );
}
