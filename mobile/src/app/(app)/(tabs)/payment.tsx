import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Lock,
  CheckCircle,
  ChevronRight,
  RotateCcw,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react-native";
import { C } from "@/theme/colors";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api/api";
import { useToastStore } from "@/lib/state/toast-store";
import {
  initRevenueCat,
  isRevenueCatConfigured,
  getOfferings,
  purchasePackage,
  restorePurchases,
  mapEntitlementsToPlan,
  getCustomerInfo,
} from "@/lib/revenuecat";
import type { PurchasesPackage } from "react-native-purchases";

// ── Types ──────────────────────────────────────────────────────────────

interface SubscriptionInfo {
  subscription: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  };
  usage: {
    tokensUsed: number;
    requestCount: number;
    imagesGenerated: number;
    audioMinutes: number;
  };
  plan: string;
}

interface Entitlements {
  maxTokensPerDay: number;
  maxRequestsPerDay: number;
  maxImagesPerDay: number;
  maxAudioMinutesPerDay: number;
  maxBuildsPerMonth: number;
  maxFilesPerProject: number;
}

type PlanName = "FREE" | "PRO" | "ENTERPRISE";

// ── Tier definitions ───────────────────────────────────────────────────

const TIERS: {
  name: PlanName;
  icon: React.ReactNode;
  color: string;
  features: string[];
  fallbackPrice: string;
  offeringId: string;
}[] = [
  {
    name: "FREE",
    icon: <Zap size={20} color={C.cy} />,
    color: C.cy,
    features: [
      "5,000 tokens/day",
      "50 requests/day",
      "5 images/day",
      "10 audio min/day",
      "1 build/month",
      "50 files/project",
    ],
    fallbackPrice: "Free",
    offeringId: "",
  },
  {
    name: "PRO",
    icon: <Crown size={20} color={C.green} />,
    color: C.green,
    features: [
      "100,000 tokens/day",
      "500 requests/day",
      "50 images/day",
      "60 audio min/day",
      "10 builds/month",
      "500 files/project",
    ],
    fallbackPrice: "$9.99/mo",
    offeringId: "pro",
  },
  {
    name: "ENTERPRISE",
    icon: <Sparkles size={20} color={C.mg} />,
    color: C.mg,
    features: [
      "Unlimited tokens",
      "Unlimited requests",
      "Unlimited images",
      "Unlimited audio",
      "Unlimited builds",
      "Unlimited files",
      "Priority support",
    ],
    fallbackPrice: "Contact Sales",
    offeringId: "enterprise",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function usagePct(used: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min((used / max) * 100, 100);
}

// ── Usage Row Component ────────────────────────────────────────────────

function UsageRow({
  label,
  used,
  max,
  color,
}: {
  label: string;
  used: number;
  max: number;
  color: string;
}) {
  const pct = usagePct(used, max);
  return (
    <View style={{ marginBottom: 14 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            color: C.dim,
            fontSize: 11,
            fontFamily: "monospace",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: C.text,
            fontSize: 11,
            fontFamily: "monospace",
          }}
        >
          {used.toLocaleString()} / {max.toLocaleString()}
        </Text>
      </View>
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: C.b1,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 2,
            backgroundColor: pct > 90 ? C.warn : color,
          }}
        />
      </View>
    </View>
  );
}

// ── Component ──────────────────────────────────────────────────────────

export default function PaymentTab() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  const [rcReady, setRcReady] = useState<boolean>(false);
  const [setupExpanded, setSetupExpanded] = useState<boolean>(false);

  // Init RevenueCat on mount
  useEffect(() => {
    initRevenueCat().then((ok) => setRcReady(ok));
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────

  const { data: subInfo, isLoading: subLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["subscription-me"],
    queryFn: () => api.get<SubscriptionInfo>("/api/subscriptions/me"),
  });

  const { data: entitlements } = useQuery<Entitlements>({
    queryKey: ["entitlements"],
    queryFn: () => api.get<Entitlements>("/api/subscriptions/entitlements"),
  });

  const { data: offerings, isLoading: offeringsLoading } = useQuery({
    queryKey: ["rc-offerings"],
    queryFn: getOfferings,
    enabled: rcReady,
  });

  // ── Mutations ────────────────────────────────────────────────────────

  const purchaseMut = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const info = await purchasePackage(pkg);
      if (!info) return null;
      await api.post("/api/subscriptions/sync", {
        plan: mapEntitlementsToPlan(info),
      });
      return info;
    },
    onSuccess: (info) => {
      if (info) {
        showToast("Purchase successful!");
        queryClient.invalidateQueries({ queryKey: ["subscription-me"] });
        queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      }
    },
    onError: (err: Error) => {
      showToast(err.message || "Purchase failed");
    },
  });

  const restoreMut = useMutation({
    mutationFn: async () => {
      const info = await restorePurchases();
      if (info) {
        await api.post("/api/subscriptions/sync", {
          plan: mapEntitlementsToPlan(info),
        });
      }
      return info;
    },
    onSuccess: (info) => {
      if (info) {
        showToast("Purchases restored!");
        queryClient.invalidateQueries({ queryKey: ["subscription-me"] });
        queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      } else {
        showToast("No purchases to restore");
      }
    },
    onError: () => {
      showToast("Restore failed");
    },
  });

  // ── Derived state ────────────────────────────────────────────────────

  const currentPlan: PlanName = (subInfo?.plan as PlanName) ?? "FREE";
  const renewalDate = subInfo?.subscription?.currentPeriodEnd ?? null;
  const usage = subInfo?.usage ?? {
    tokensUsed: 0,
    requestCount: 0,
    imagesGenerated: 0,
    audioMinutes: 0,
  };
  const limits = entitlements ?? {
    maxTokensPerDay: 5000,
    maxRequestsPerDay: 50,
    maxImagesPerDay: 5,
    maxAudioMinutesPerDay: 10,
    maxBuildsPerMonth: 1,
    maxFilesPerProject: 50,
  };

  // Find RevenueCat packages for each tier
  function findPackage(offeringId: string): PurchasesPackage | null {
    if (!offerings?.current?.availablePackages) return null;
    const allOfferings = offerings.all;
    if (allOfferings?.[offeringId]) {
      const pkg = allOfferings[offeringId]?.availablePackages?.[0];
      if (pkg) return pkg;
    }
    return null;
  }

  function getPriceLabel(tier: (typeof TIERS)[number]): string {
    if (tier.name === "FREE") return "Free";
    if (tier.name === "ENTERPRISE") return tier.fallbackPrice;
    const pkg = findPackage(tier.offeringId);
    if (pkg) return pkg.product.priceString;
    return tier.fallbackPrice;
  }

  function getButtonLabel(tierName: PlanName): string {
    if (tierName === currentPlan) return "Current Plan";
    const tierOrder: Record<PlanName, number> = {
      FREE: 0,
      PRO: 1,
      ENTERPRISE: 2,
    };
    return tierOrder[tierName] > tierOrder[currentPlan] ? "Upgrade" : "Downgrade";
  }

  function handleTierPress(tier: (typeof TIERS)[number]) {
    if (tier.name === currentPlan) return;
    if (tier.name === "FREE") {
      showToast("Manage subscription in device settings");
      return;
    }
    if (tier.name === "ENTERPRISE") {
      showToast("Contact sales for Enterprise");
      return;
    }
    const pkg = findPackage(tier.offeringId);
    if (!pkg) {
      showToast("Package not available");
      return;
    }
    purchaseMut.mutate(pkg);
  }

  // ── Loading state ────────────────────────────────────────────────────

  if (subLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color={C.cy} />
        <Text
          style={{
            color: C.dim,
            fontSize: 12,
            fontFamily: "monospace",
            marginTop: 12,
          }}
        >
          Loading subscription...
        </Text>
      </SafeAreaView>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: C.green + "20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <CreditCard size={16} color={C.green} />
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
              PAYMENTS
            </Text>
            <Text
              style={{
                color: C.dim,
                fontSize: 11,
                fontFamily: "monospace",
                letterSpacing: 1,
              }}
            >
              Manage your subscription
            </Text>
          </View>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: C.green + "30",
            marginTop: 12,
            shadowColor: C.green,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* ── Current Plan Badge ────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: C.s1,
            borderWidth: 1,
            borderColor:
              currentPlan === "PRO"
                ? C.green + "40"
                : currentPlan === "ENTERPRISE"
                  ? C.mg + "40"
                  : C.cy + "40",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {currentPlan === "FREE" ? (
              <Zap size={18} color={C.cy} />
            ) : currentPlan === "PRO" ? (
              <Crown size={18} color={C.green} />
            ) : (
              <Sparkles size={18} color={C.mg} />
            )}
            <View>
              <Text
                style={{
                  color: C.text,
                  fontSize: 14,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  letterSpacing: 2,
                }}
              >
                {currentPlan} PLAN
              </Text>
              {renewalDate ? (
                <Text
                  style={{
                    color: C.dim,
                    fontSize: 10,
                    fontFamily: "monospace",
                    marginTop: 2,
                  }}
                >
                  Renews {formatDate(renewalDate)}
                </Text>
              ) : null}
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor:
                currentPlan === "PRO"
                  ? C.green + "20"
                  : currentPlan === "ENTERPRISE"
                    ? C.mg + "20"
                    : C.cy + "20",
            }}
          >
            <Text
              style={{
                color:
                  currentPlan === "PRO"
                    ? C.green
                    : currentPlan === "ENTERPRISE"
                      ? C.mg
                      : C.cy,
                fontSize: 10,
                fontFamily: "monospace",
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
              ACTIVE
            </Text>
          </View>
        </View>

        {/* ── Tier Cards ────────────────────────────────────────────── */}
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
          Subscription Plans
        </Text>

        {TIERS.map((tier) => {
          const isCurrent = tier.name === currentPlan;
          const btnLabel = getButtonLabel(tier.name);
          const price = getPriceLabel(tier);

          return (
            <View
              key={tier.name}
              style={{
                backgroundColor: C.s1,
                borderWidth: isCurrent ? 1.5 : 1,
                borderColor: isCurrent ? tier.color + "60" : C.b1,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              {/* Tier header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {tier.icon}
                  <Text
                    style={{
                      color: tier.color,
                      fontSize: 14,
                      fontFamily: "monospace",
                      fontWeight: "bold",
                      letterSpacing: 2,
                    }}
                  >
                    {tier.name}
                  </Text>
                </View>
                <Text
                  style={{
                    color: C.text,
                    fontSize: 14,
                    fontFamily: "monospace",
                    fontWeight: "bold",
                  }}
                >
                  {price}
                </Text>
              </View>

              {/* Feature list */}
              {tier.features.map((feat) => (
                <View
                  key={feat}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <CheckCircle size={12} color={tier.color + "80"} />
                  <Text
                    style={{
                      color: C.dim,
                      fontSize: 11,
                      fontFamily: "monospace",
                    }}
                  >
                    {feat}
                  </Text>
                </View>
              ))}

              {/* Action button */}
              <View style={{ marginTop: 10 }}>
                {isCurrent ? (
                  <View
                    style={{
                      backgroundColor: tier.color + "15",
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: tier.color,
                        fontSize: 12,
                        fontFamily: "monospace",
                        fontWeight: "700",
                        letterSpacing: 1,
                      }}
                    >
                      CURRENT PLAN
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => handleTierPress(tier)}
                    disabled={purchaseMut.isPending}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? tier.color + "30" : tier.color + "20",
                      borderWidth: 1,
                      borderColor: tier.color + "40",
                      borderRadius: 8,
                      paddingVertical: 10,
                      alignItems: "center",
                      opacity: purchaseMut.isPending ? 0.5 : 1,
                    })}
                  >
                    {purchaseMut.isPending ? (
                      <ActivityIndicator size="small" color={tier.color} />
                    ) : (
                      <Text
                        style={{
                          color: tier.color,
                          fontSize: 12,
                          fontFamily: "monospace",
                          fontWeight: "700",
                          letterSpacing: 1,
                        }}
                      >
                        {btnLabel.toUpperCase()}
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}

        {/* ── Restore Purchases ─────────────────────────────────────── */}
        <Pressable
          onPress={() => restoreMut.mutate()}
          disabled={restoreMut.isPending || !rcReady}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            marginBottom: 20,
            opacity: !rcReady ? 0.4 : pressed ? 0.7 : 1,
          })}
        >
          {restoreMut.isPending ? (
            <ActivityIndicator size="small" color={C.dim} />
          ) : (
            <RotateCcw size={14} color={C.dim} />
          )}
          <Text
            style={{
              color: C.dim,
              fontSize: 12,
              fontFamily: "monospace",
              letterSpacing: 1,
            }}
          >
            Restore Purchases
          </Text>
        </Pressable>

        {/* ── Usage Stats ───────────────────────────────────────────── */}
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
          {"Today's Usage"}
        </Text>

        <View
          style={{
            backgroundColor: C.s1,
            borderWidth: 1,
            borderColor: C.b1,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <UsageRow
            label="Tokens"
            used={usage.tokensUsed}
            max={limits.maxTokensPerDay}
            color={C.cy}
          />
          <UsageRow
            label="Requests"
            used={usage.requestCount}
            max={limits.maxRequestsPerDay}
            color={C.green}
          />
          <UsageRow
            label="Images"
            used={usage.imagesGenerated}
            max={limits.maxImagesPerDay}
            color={C.mg}
          />
          <UsageRow
            label="Audio (min)"
            used={usage.audioMinutes}
            max={limits.maxAudioMinutesPerDay}
            color={C.warn}
          />
        </View>

        {/* ── RevenueCat Setup (collapsible) ────────────────────────── */}
        {!rcReady ? (
          <View style={{ marginBottom: 20 }}>
            <Pressable
              onPress={() => setSetupExpanded(!setupExpanded)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: C.s1,
                borderWidth: 1,
                borderColor: C.warn + "30",
                borderRadius: 10,
                padding: 14,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Lock size={14} color={C.warn} />
                <Text
                  style={{
                    color: C.warn,
                    fontSize: 12,
                    fontFamily: "monospace",
                    fontWeight: "700",
                    letterSpacing: 1,
                  }}
                >
                  RevenueCat Not Connected
                </Text>
              </View>
              <ChevronRight
                size={14}
                color={C.warn}
                style={{
                  transform: [{ rotate: setupExpanded ? "90deg" : "0deg" }],
                }}
              />
            </Pressable>

            {setupExpanded ? (
              <View
                style={{
                  backgroundColor: C.s1,
                  borderWidth: 1,
                  borderTopWidth: 0,
                  borderColor: C.warn + "30",
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,
                  padding: 14,
                  marginTop: -1,
                }}
              >
                <Text
                  style={{
                    color: C.dim,
                    fontSize: 11,
                    fontFamily: "monospace",
                    lineHeight: 18,
                    marginBottom: 12,
                  }}
                >
                  Connect RevenueCat to enable real in-app purchases.
                </Text>

                {[
                  { step: "01", text: "Create a free account at revenuecat.com" },
                  { step: "02", text: "Create a new project and add your app" },
                  { step: "03", text: "Copy your Public SDK key from the API keys section" },
                  { step: "04", text: "Add EXPO_PUBLIC_REVENUECAT_KEY to your ENV tab" },
                ].map((item) => (
                  <View
                    key={item.step}
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: C.warn + "20",
                        borderWidth: 1,
                        borderColor: C.warn + "50",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Text
                        style={{
                          color: C.warn,
                          fontSize: 8,
                          fontFamily: "monospace",
                          fontWeight: "700",
                        }}
                      >
                        {item.step}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: C.dim,
                        fontSize: 11,
                        fontFamily: "monospace",
                        flex: 1,
                        lineHeight: 16,
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <Box accentColor={C.green} className="mb-5">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <CheckCircle size={14} color={C.green} />
              <Text
                style={{
                  color: C.green,
                  fontSize: 12,
                  fontFamily: "monospace",
                  fontWeight: "700",
                }}
              >
                RevenueCat Connected
              </Text>
            </View>
          </Box>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
