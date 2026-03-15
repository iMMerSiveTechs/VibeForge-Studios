import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Brain, Send } from "lucide-react-native";
import {
  chatWithAI,
  chatWithAIStream,
} from "@/lib/ai";
import { C } from "@/theme/colors";

export function ChatSection() {
  const [prompt, setPrompt] = useState<string>("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [streaming, setStreaming] = useState<boolean>(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async (useStreaming: boolean) => {
    if (!prompt.trim() || loading) return;

    const userMessage = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setLoading(true);
    setStreaming(useStreaming);

    try {
      if (useStreaming) {
        let streamedText = "";
        setMessages((prev) => [...prev, { role: "ai", text: "" }]);

        await chatWithAIStream(
          userMessage,
          (chunk) => {
            streamedText += chunk;
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { role: "ai", text: streamedText };
              return newMessages;
            });
          },
          () => {
            setLoading(false);
            setStreaming(false);
          },
          (error) => {
            Alert.alert("Error", error);
            setLoading(false);
            setStreaming(false);
          }
        );
      } else {
        const response = await chatWithAI(userMessage);
        setMessages((prev) => [...prev, { role: "ai", text: response.text }]);
        setLoading(false);
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to chat");
      setLoading(false);
      setStreaming(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Brain size={48} color={C.dim} />
            <Text style={{ fontSize: 16, color: C.dim, marginTop: 16, textAlign: "center" }}>
              Start a conversation with AI
            </Text>
          </View>
        )}

        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
            }}
          >
            <View
              style={{
                backgroundColor: msg.role === "user" ? C.cy : C.s2,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: msg.role === "user" ? C.cy : C.b1,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: msg.role === "user" ? C.bg : C.text,
                  lineHeight: 22,
                }}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {loading && !streaming ? (
          <View style={{ alignSelf: "flex-start" }}>
            <View
              style={{
                backgroundColor: C.s2,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.b1,
              }}
            >
              <ActivityIndicator size="small" color={C.cy} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Input Area */}
      <View
        style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: C.b1,
          backgroundColor: C.s1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
          }}
        >
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask anything..."
            placeholderTextColor={C.dim}
            style={{
              flex: 1,
              backgroundColor: C.s2,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.b1,
              color: C.text,
              fontSize: 15,
            }}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={() => handleSend(false)}
            disabled={loading || !prompt.trim()}
            style={{
              backgroundColor: prompt.trim() && !loading ? C.cy : C.s2,
              width: 44,
              height: 44,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send size={20} color={prompt.trim() && !loading ? C.bg : C.dim} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 11, color: C.dim, marginTop: 8, textAlign: "center" }}>
          Tap send for instant response (streaming enabled by default)
        </Text>
      </View>
    </View>
  );
}
