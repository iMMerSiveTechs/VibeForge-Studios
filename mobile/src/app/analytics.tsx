import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, Zap, Hash, Image, Volume2, DollarSign, Clock } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { api } from "@/lib/api/api";
import { Box } from "@/components/ui/Box";

const COLORS = {
  bg: "#020203",
  surface: "#0B0C10",
  surfaceHigh: "#12141A",
  cyan: "#95CBDE",
  magenta: "#A75FBB",
  violet: "#413672",
  lilac: "#C3A6FF",
  amber: "#FFB74D",
  mint: "#88EECC",
  text: "#E8EDF2",
  dim: "#4A5568",
  dimmer: "#2D3748",
};

// --- Types ---

interface UsageRecord {
  id: string;
  date: string;
  tokensUsed: number;
  requestCount: number;
  imagesGenerated: number;
  audioMinutes: number;
}

interface UsageTotals {
  tokens: number;
  requests: number;
  images: number;
  audio: number;
}

interface UsageData {
  daily: UsageRecord[];
  totals: UsageTotals;
}

interface CostData {
  estimatedCostUSD: number;
  breakdown: { tokens: number; images: number; audio: number };
}

interface Activity {
  id: string;
  projectName: string;
  role: string;
  contentPreview: string;
  createdAt: string;
}

// --- Bar Chart ---

function BarChart({ data }: { data: UsageRecord[] }) {
  // Take last 7 days, reverse so oldest is first
  const last7 = useMemo(() => {
    const slice = data.slice(0, 7);
    return [...slice].reverse();
  }, [data]);

  const maxTokens = useMemo(
    () => Math.max(...last7.map((d) => d.tokensUsed), 1),
    [last7]
  );

  if (last7.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <Text style={{ color: COLORS.dim, fontSize: 12, fontFamily: "monospace" }}>
          No usage data yet
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, gap: 6 }}>
      {last7.map((record, i) => {
        const heightPct = (record.tokensUsed / maxTokens) * 100;
        const dayLabel = record.date.slice(5); // MM-DD

        return (
          <View key={record.id ?? i} style={{ flex: 1, alignItems: "center" }}>
            <AnimatedBar heightPct={heightPct} index={i} />
            <Text
              style={{
                color: COLORS.dim,
                fontSize: 8,
                fontFamily: "monospace",
                marginTop: 4,
              }}
            >
              {dayLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function AnimatedBar({ heightPct, index }: { heightPct: number; index: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    height: withDelay(index * 80, withTiming(Math.max(heightPct, 2), { duration: 500 })),
  }));

  return (
    <Animated.View
      style={[
        {
          width: "100%",
          borderRadius: 4,
          backgroundColor: COLORS.cyan,
          minHeight: 2,
          maxHeight: 100,
        },
        animatedStyle,
      ]}
    />
  );
}

// --- Stat Card ---

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.dimmer,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {icon}
        <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 1 }}>
          {label}
        </Text>
      </View>
      <Text style={{ color, fontSize: 20, fontFamily: "monospace", fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

// --- Activity Item ---

function ActivityItem({ item }: { item: Activity }) {
  const time = new Date(item.createdAt);
  const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`;

  return (
    <View
      style={{
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.dimmer,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: item.role === "user" ? COLORS.cyan : COLORS.magenta,
            }}
          />
          <Text style={{ color: COLORS.text, fontSize: 11, fontFamily: "monospace", fontWeight: "600" }}>
            {item.projectName}
          </Text>
        </View>
        <Text style={{ color: COLORS.dim, fontSize: 9, fontFamily: "monospace" }}>
          {timeStr}
        </Text>
      </View>
      <Text
        style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace", lineHeight: 16 }}
        numberOfLines={2}
      >
        {item.contentPreview}
      </Text>
    </View>
  );
}

// --- Formatters ---

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// --- Main Screen ---

export default function AnalyticsScreen() {
  const router = useRouter();

  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ["analytics", "usage"],
    queryFn: () => api.get<UsageData>("/api/analytics/usage"),
  });

  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: ["analytics", "cost"],
    queryFn: () => api.get<CostData>("/api/analytics/cost"),
  });

  const { data: activities, isLoading: activityLoading } = useQuery({
    queryKey: ["analytics", "activity"],
    queryFn: () => api.get<Activity[]>("/api/analytics/activity"),
  });

  const isLoading = usageLoading || costLoading || activityLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <ChevronLeft size={22} color={COLORS.text} />
        </Pressable>
        <View>
          <Text style={{ color: COLORS.text, fontSize: 18, fontFamily: "monospace", fontWeight: "700", letterSpacing: 2 }}>
            ANALYTICS
          </Text>
          <Text style={{ color: COLORS.dim, fontSize: 10, fontFamily: "monospace", letterSpacing: 1 }}>
            Usage & Cost Tracking
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={COLORS.cyan} />
          <Text style={{ color: COLORS.dim, fontSize: 11, fontFamily: "monospace", marginTop: 12 }}>
            Loading analytics...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Usage Stats - 2x2 Grid */}
          <Text style={{ color: COLORS.cyan, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, marginTop: 4 }}>
            Usage Stats
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <StatCard
              label="Tokens"
              value={formatNumber(usageData?.totals.tokens ?? 0)}
              icon={<Zap size={14} color={COLORS.cyan} />}
              color={COLORS.cyan}
            />
            <StatCard
              label="Requests"
              value={formatNumber(usageData?.totals.requests ?? 0)}
              icon={<Hash size={14} color={COLORS.lilac} />}
              color={COLORS.lilac}
            />
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            <StatCard
              label="Images"
              value={formatNumber(usageData?.totals.images ?? 0)}
              icon={<Image size={14} color={COLORS.amber} />}
              color={COLORS.amber}
            />
            <StatCard
              label="Audio Min"
              value={(usageData?.totals.audio ?? 0).toFixed(1)}
              icon={<Volume2 size={14} color={COLORS.mint} />}
              color={COLORS.mint}
            />
          </View>

          {/* Daily Usage Chart */}
          <Text style={{ color: COLORS.magenta, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Daily Token Usage (7 days)
          </Text>
          <Box accentColor={COLORS.magenta} className="mb-5">
            <BarChart data={usageData?.daily ?? []} />
          </Box>

          {/* Cost Estimate */}
          <Text style={{ color: COLORS.amber, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Cost Estimate
          </Text>
          <Box accentColor={COLORS.amber} className="mb-5">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <DollarSign size={20} color={COLORS.amber} />
              <Text style={{ color: COLORS.text, fontSize: 28, fontFamily: "monospace", fontWeight: "700" }}>
                ${(costData?.estimatedCostUSD ?? 0).toFixed(2)}
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              <CostRow label="Tokens" value={costData?.breakdown.tokens ?? 0} color={COLORS.cyan} />
              <CostRow label="Images" value={costData?.breakdown.images ?? 0} color={COLORS.amber} />
              <CostRow label="Audio" value={costData?.breakdown.audio ?? 0} color={COLORS.mint} />
            </View>
          </Box>

          {/* Recent Activity */}
          <Text style={{ color: COLORS.lilac, fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            Recent Activity
          </Text>
          {(activities ?? []).length === 0 ? (
            <Box className="mb-5">
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <Clock size={20} color={COLORS.dim} />
                <Text style={{ color: COLORS.dim, fontSize: 11, fontFamily: "monospace", marginTop: 8 }}>
                  No recent activity
                </Text>
              </View>
            </Box>
          ) : (
            <View style={{ marginBottom: 20 }}>
              {(activities ?? []).map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CostRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: COLORS.dim, fontSize: 11, fontFamily: "monospace" }}>{label}</Text>
      <Text style={{ color, fontSize: 12, fontFamily: "monospace", fontWeight: "600" }}>
        ${value.toFixed(2)}
      </Text>
    </View>
  );
}
