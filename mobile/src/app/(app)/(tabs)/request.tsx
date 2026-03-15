import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Send,
} from "lucide-react-native";
import { C } from "@/theme/colors";
import { useToastStore } from "@/lib/state/toast-store";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "vf_requests";

type RequestType = "bug" | "feature" | "question" | "other";

interface RequestEntry {
  id: string;
  type: RequestType;
  subject: string;
  description: string;
  submittedAt: string;
}

const REQUEST_TYPES: {
  type: RequestType;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { type: "bug", label: "Bug Report", icon: null, color: C.red },
  { type: "feature", label: "Feature Request", icon: null, color: C.cy },
  { type: "question", label: "Question", icon: null, color: C.warn },
  { type: "other", label: "Other", icon: null, color: C.mid },
];

function typeIcon(type: RequestType, size: number, color: string) {
  switch (type) {
    case "bug":
      return <Bug size={size} color={color} />;
    case "feature":
      return <Lightbulb size={size} color={color} />;
    case "question":
      return <HelpCircle size={size} color={color} />;
    default:
      return <MoreHorizontal size={size} color={color} />;
  }
}

function typeColor(type: RequestType): string {
  const found = REQUEST_TYPES.find((t) => t.type === type);
  return found ? found.color : C.mid;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function RequestTab() {
  const [selectedType, setSelectedType] = useState<RequestType>("feature");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RequestEntry[];
        setRequests(parsed);
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      showToast("Please enter a subject");
      return;
    }
    if (!description.trim()) {
      showToast("Please enter a description");
      return;
    }

    setIsSubmitting(true);
    try {
      const newRequest: RequestEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: selectedType,
        subject: subject.trim(),
        description: description.trim(),
        submittedAt: new Date().toISOString(),
      };

      const updated = [newRequest, ...requests];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setRequests(updated);

      setSubject("");
      setDescription("");
      setSelectedType("feature");
      showToast("Request submitted!");
    } catch {
      showToast("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: C.cy + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <MessageSquarePlus size={16} color={C.cy} />
            </View>
            <View>
              <Text
                style={{
                  color: C.text,
                  fontSize: 18,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  letterSpacing: 4,
                }}
              >
                REQUEST
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                  letterSpacing: 1,
                }}
              >
                Feedback & feature requests
              </Text>
            </View>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: C.cy + "30",
              marginTop: 12,
              shadowColor: C.cy,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form */}
          <Box accentColor={C.cy} className="mb-5">
            <Text
              style={{
                color: C.cy,
                fontSize: 10,
                fontFamily: "monospace",
                fontWeight: "700",
                letterSpacing: 2,
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              New Request
            </Text>

            {/* Type chips */}
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Type
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0, marginBottom: 14 }}
            >
              <View style={{ flexDirection: "row", gap: 8 }}>
                {REQUEST_TYPES.map((rt) => {
                  const isActive = selectedType === rt.type;
                  return (
                    <Pressable
                      key={rt.type}
                      onPress={() => setSelectedType(rt.type)}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isActive
                          ? rt.color + "25"
                          : pressed
                          ? C.b2
                          : C.bg,
                        borderWidth: 1,
                        borderColor: isActive ? rt.color + "80" : C.b2,
                      })}
                    >
                      {typeIcon(rt.type, 12, isActive ? rt.color : C.dim)}
                      <Text
                        style={{
                          color: isActive ? rt.color : C.dim,
                          fontSize: 11,
                          fontFamily: "monospace",
                          fontWeight: isActive ? "700" : "400",
                          letterSpacing: 0.5,
                        }}
                      >
                        {rt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Subject */}
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Subject
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Brief summary..."
              placeholderTextColor={C.dim}
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.b2,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: C.text,
                fontSize: 13,
                fontFamily: "monospace",
                marginBottom: 12,
              }}
            />

            {/* Description */}
            <Text
              style={{
                color: C.dim,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe in detail..."
              placeholderTextColor={C.dim}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={{
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.b2,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: C.text,
                fontSize: 13,
                fontFamily: "monospace",
                minHeight: 110,
                marginBottom: 16,
              }}
            />

            <Button
              label={isSubmitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
              onPress={handleSubmit}
              loading={isSubmitting}
              variant="secondary"
              icon={<Send size={14} color="#000" />}
            />
          </Box>

          {/* Recent requests */}
          <Text
            style={{
              color: C.dim,
              fontSize: 10,
              fontFamily: "monospace",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Recent Requests
          </Text>

          {requests.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 28,
                backgroundColor: C.s1,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.b1,
              }}
            >
              <Clock size={24} color={C.dim} style={{ marginBottom: 10 }} />
              <Text
                style={{
                  color: C.dim,
                  fontSize: 12,
                  fontFamily: "monospace",
                  textAlign: "center",
                }}
              >
                No requests yet
              </Text>
            </View>
          ) : (
            requests.map((req) => {
              const col = typeColor(req.type);
              return (
                <View
                  key={req.id}
                  style={{
                    backgroundColor: C.s1,
                    borderWidth: 1,
                    borderLeftWidth: 3,
                    borderColor: C.b1,
                    borderLeftColor: col,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    {typeIcon(req.type, 12, col)}
                    <Text
                      style={{
                        color: col,
                        fontSize: 9,
                        fontFamily: "monospace",
                        fontWeight: "700",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        flex: 1,
                      }}
                    >
                      {REQUEST_TYPES.find((t) => t.type === req.type)?.label}
                    </Text>
                    <Text
                      style={{
                        color: C.dim,
                        fontSize: 9,
                        fontFamily: "monospace",
                      }}
                    >
                      {formatDate(req.submittedAt)}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: C.text,
                      fontSize: 13,
                      fontFamily: "monospace",
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                    numberOfLines={1}
                  >
                    {req.subject}
                  </Text>
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 11,
                      fontFamily: "monospace",
                      lineHeight: 17,
                    }}
                    numberOfLines={2}
                  >
                    {req.description}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
