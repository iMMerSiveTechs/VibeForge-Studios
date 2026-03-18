import React, { useState, useMemo, useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  FilePlus,
  FolderPlus,
  Trash2,
  Pencil,
} from "lucide-react-native";
import { C } from "@/theme/colors";
import { cn } from "@/lib/cn";

// --- Types ---

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

interface FileExplorerProps {
  files: Array<{ path: string; content: string }>;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onDeleteFile?: (path: string) => void;
  onRenameFile?: (path: string) => void;
  projectName?: string;
}

// --- Build tree from flat file paths ---

function buildTree(files: Array<{ path: string }>): FileNode[] {
  const root: FileNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;
      const partialPath = parts.slice(0, i + 1).join("/");

      const existing = current.find((n) => n.name === name);
      if (existing) {
        if (existing.children) {
          current = existing.children;
        }
      } else {
        const node: FileNode = {
          name,
          path: partialPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        current.push(node);
        if (node.children) {
          current = node.children;
        }
      }
    }
  }

  // Sort: folders first, then alphabetically
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children) sortNodes(n.children);
    }
  };
  sortNodes(root);
  return root;
}

// --- File icon color by extension ---

function getFileColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "#3178C6";
    case "js":
    case "jsx":
      return "#F7DF1E";
    case "json":
      return "#6D8346";
    case "css":
      return "#264DE4";
    case "html":
      return "#E34F26";
    case "md":
      return "#FFFFFF";
    case "prisma":
      return "#2D3748";
    case "env":
      return "#ECD53F";
    default:
      return C.dim;
  }
}

// --- Tree Node ---

function TreeNode({
  node,
  depth,
  selectedPath,
  expanded,
  onToggle,
  onSelectFile,
  onDeleteFile,
  onRenameFile,
}: {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelectFile: (path: string) => void;
  onDeleteFile?: (path: string) => void;
  onRenameFile?: (path: string) => void;
}) {
  const isOpen = expanded.has(node.path);
  const isSelected = node.path === selectedPath;
  const [showActions, setShowActions] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => {
          if (node.type === "folder") {
            onToggle(node.path);
          } else {
            onSelectFile(node.path);
          }
        }}
        onLongPress={() => setShowActions(!showActions)}
        className={cn(
          "flex-row items-center py-1.5 pr-2",
          isSelected ? "bg-vf-s2" : "bg-transparent"
        )}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {/* Chevron / Spacer */}
        {node.type === "folder" ? (
          isOpen ? (
            <ChevronDown size={12} color={C.dim} />
          ) : (
            <ChevronRight size={12} color={C.dim} />
          )
        ) : (
          <View style={{ width: 12 }} />
        )}

        {/* Icon */}
        <View className="ml-1 mr-1.5">
          {node.type === "folder" ? (
            isOpen ? (
              <FolderOpen size={14} color={C.cy} />
            ) : (
              <Folder size={14} color={C.cy} />
            )
          ) : (
            <FileText size={14} color={getFileColor(node.name)} />
          )}
        </View>

        {/* Name */}
        <Text
          className={cn(
            "text-xs flex-1",
            isSelected ? "text-vf-cyan" : "text-vf-text"
          )}
          style={{ fontFamily: "monospace" }}
          numberOfLines={1}
        >
          {node.name}
        </Text>

        {/* Inline actions on long press */}
        {showActions ? (
          <View className="flex-row items-center" style={{ gap: 4 }}>
            {onRenameFile ? (
              <Pressable
                onPress={() => {
                  setShowActions(false);
                  onRenameFile(node.path);
                }}
                hitSlop={6}
              >
                <Pencil size={11} color={C.warn} />
              </Pressable>
            ) : null}
            {onDeleteFile ? (
              <Pressable
                onPress={() => {
                  setShowActions(false);
                  onDeleteFile(node.path);
                }}
                hitSlop={6}
              >
                <Trash2 size={11} color={C.red} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Pressable>

      {/* Children */}
      {node.type === "folder" && isOpen && node.children
        ? node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expanded={expanded}
              onToggle={onToggle}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
            />
          ))
        : null}
    </View>
  );
}

// --- Main Component ---

export function FileExplorer({
  files,
  selectedPath,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  projectName,
}: FileExplorerProps) {
  const tree = useMemo(() => buildTree(files), [files]);

  // Auto-expand top-level folders
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const node of tree) {
      if (node.type === "folder") initial.add(node.path);
    }
    return initial;
  });

  // Auto-expand any new top-level folders when files change
  useEffect(() => {
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const node of tree) {
        if (node.type === "folder" && !next.has(node.path)) {
          next.add(node.path);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tree]);

  const handleToggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <View className="flex-1 bg-vf-s1 border-r border-vf-b1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-3 py-2 border-b border-vf-b1">
        <Text
          className="text-vf-cyan text-xs uppercase tracking-wider flex-1"
          style={{ fontFamily: "monospace" }}
          numberOfLines={1}
        >
          {projectName ?? "Files"}
        </Text>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          {onCreateFile ? (
            <Pressable onPress={onCreateFile} hitSlop={8}>
              <FilePlus size={14} color={C.mid} />
            </Pressable>
          ) : null}
          {onCreateFolder ? (
            <Pressable onPress={onCreateFolder} hitSlop={8}>
              <FolderPlus size={14} color={C.mid} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Tree */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {tree.length > 0 ? (
          tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expanded={expanded}
              onToggle={handleToggle}
              onSelectFile={onSelectFile}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
            />
          ))
        ) : (
          <View className="px-3 py-8 items-center">
            <Folder size={24} color={C.dim} />
            <Text
              className="text-vf-dim text-xs mt-2 text-center"
              style={{ fontFamily: "monospace" }}
            >
              No files yet
            </Text>
            {onCreateFile ? (
              <Pressable
                onPress={onCreateFile}
                className="mt-3 flex-row items-center px-3 py-1.5 rounded-lg bg-vf-s2 border border-vf-b1"
              >
                <Plus size={12} color={C.cy} />
                <Text
                  className="text-vf-cyan text-xs ml-1"
                  style={{ fontFamily: "monospace" }}
                >
                  New File
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
