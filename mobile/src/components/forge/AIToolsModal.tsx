import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Modal,
  Pressable,
  SafeAreaView,
} from "react-native";
import { X, Brain } from "lucide-react-native";
import { C } from "@/theme/colors";
import {
  SectionButton,
  ChatSection,
  ImageGenerateSection,
  ImageAnalyzeSection,
  TranscribeSection,
  TTSSection,
} from "../ai-tools";

type Section = "chat" | "image-gen" | "image-analyze" | "transcribe" | "tts";

interface AIToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIToolsModal({ isOpen, onClose }: AIToolsModalProps) {
  const [activeSection, setActiveSection] = useState<Section>("chat");

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
            <Brain size={16} color={C.mid} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: C.text,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              AI TOOLS
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={18} color={C.dim} />
          </Pressable>
        </View>

        {/* Section Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: C.b1 }}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 6 }}
        >
          <SectionButton
            icon={Brain}
            label="Chat"
            active={activeSection === "chat"}
            onPress={() => setActiveSection("chat")}
          />
          <SectionButton
            icon={require("lucide-react-native").ImageIcon}
            label="Generate"
            active={activeSection === "image-gen"}
            onPress={() => setActiveSection("image-gen")}
          />
          <SectionButton
            icon={require("lucide-react-native").Camera}
            label="Analyze"
            active={activeSection === "image-analyze"}
            onPress={() => setActiveSection("image-analyze")}
          />
          <SectionButton
            icon={require("lucide-react-native").Mic}
            label="Transcribe"
            active={activeSection === "transcribe"}
            onPress={() => setActiveSection("transcribe")}
          />
          <SectionButton
            icon={require("lucide-react-native").Volume2}
            label="TTS"
            active={activeSection === "tts"}
            onPress={() => setActiveSection("tts")}
          />
        </ScrollView>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {activeSection === "chat" && <ChatSection />}
          {activeSection === "image-gen" && <ImageGenerateSection />}
          {activeSection === "image-analyze" && <ImageAnalyzeSection />}
          {activeSection === "transcribe" && <TranscribeSection />}
          {activeSection === "tts" && <TTSSection />}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
