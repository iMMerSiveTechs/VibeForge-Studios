import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { C } from "@/theme/colors";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
        onPress={onClose}
      >
        <Pressable
          className="bg-vf-s1 border border-vf-b1 rounded-2xl w-[90%] max-h-[80%] overflow-hidden"
          onPress={() => {}}
        >
          {/* Title bar */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-vf-b1">
            <Text
              className="text-vf-cyan text-sm uppercase tracking-wider"
              style={{ fontFamily: "monospace" }}
            >
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-lg bg-vf-s2"
              hitSlop={8}
            >
              <X size={16} color={C.mid} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            className="px-4 py-3"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
          >
            {children}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
