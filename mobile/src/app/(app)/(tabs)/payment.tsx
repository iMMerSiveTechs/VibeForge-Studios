import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CreditCard,
  Lock,
  CheckCircle,
  ChevronRight,
  RotateCcw,
  History,
} from "lucide-react-native";
import { C } from "@/theme/colors";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";

// RevenueCat connection status - check if package is available
let revenueCatAvailable = false;
try {
  require("react-native-purchases");
  revenueCatAvailable = true;
} catch {
  revenueCatAvailable = false;
}

const LOCKED_SECTIONS = [
  {
    icon: <CheckCircle size={16} color={C.dim} />,
    label: "Subscription Plans",
    desc: "Free, Pro, and Enterprise tiers",
  },
  {
    icon: <History size={16} color={C.dim} />,
    label: "Purchase History",
    desc: "View all past transactions",
  },
  {
    icon: <RotateCcw size={16} color={C.dim} />,
    label: "Restore Purchases",
    desc: "Recover previous purchases",
  },
];

export default function PaymentTab() {
  const isConnected = revenueCatAvailable;

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
              Monetize your app
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* Connect RevenueCat Banner */}
        {!isConnected ? (
          <>
            {/* Lock icon + hero */}
            <View
              style={{
                alignItems: "center",
                paddingVertical: 28,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  backgroundColor: C.s1,
                  borderWidth: 1,
                  borderColor: C.b2,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Lock size={32} color={C.green} />
              </View>
              <Text
                style={{
                  color: C.text,
                  fontSize: 16,
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  letterSpacing: 3,
                  marginBottom: 8,
                }}
              >
                CONNECT REVENUECAT
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 12,
                  fontFamily: "monospace",
                  textAlign: "center",
                  lineHeight: 20,
                  maxWidth: 260,
                }}
              >
                Add subscriptions and in-app purchases to your app with RevenueCat
              </Text>
            </View>

            {/* Setup instructions card */}
            <Box accentColor={C.green} className="mb-5">
              <Text
                style={{
                  color: C.green,
                  fontSize: 10,
                  fontFamily: "monospace",
                  fontWeight: "700",
                  letterSpacing: 2,
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                Setup Instructions
              </Text>

              {[
                {
                  step: "01",
                  text: "Create a free account at revenuecat.com",
                },
                {
                  step: "02",
                  text: 'Create a new project and add your app',
                },
                {
                  step: "03",
                  text: "Copy your Public SDK key from the API keys section",
                },
                {
                  step: "04",
                  text: "Add REVENUECAT_PUBLIC_KEY to your ENV tab in Vibecode",
                },
              ].map((item) => (
                <View
                  key={item.step}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: C.green + "20",
                      borderWidth: 1,
                      borderColor: C.green + "50",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Text
                      style={{
                        color: C.green,
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
                      fontSize: 12,
                      fontFamily: "monospace",
                      flex: 1,
                      lineHeight: 18,
                    }}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}
            </Box>

            {/* Vibecode Payments Tab card */}
            <Box accentColor={C.warn} className="mb-6">
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <CreditCard size={14} color={C.warn} />
                <Text
                  style={{
                    color: C.warn,
                    fontSize: 10,
                    fontFamily: "monospace",
                    fontWeight: "700",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Vibecode Payments Tab
                </Text>
              </View>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 12,
                  fontFamily: "monospace",
                  lineHeight: 18,
                }}
              >
                Go to the Payments tab in the Vibecode builder to connect your RevenueCat account and configure subscription plans directly from the Vibecode interface.
              </Text>
            </Box>
          </>
        ) : (
          <Box accentColor={C.green} className="mb-5">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <CheckCircle size={16} color={C.green} />
              <Text
                style={{
                  color: C.green,
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: "700",
                }}
              >
                RevenueCat Connected
              </Text>
            </View>
          </Box>
        )}

        {/* Locked/Disabled Sections */}
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
          Features
        </Text>

        {LOCKED_SECTIONS.map((section) => (
          <Pressable
            key={section.label}
            disabled={!isConnected}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: pressed && isConnected ? C.s2 : C.s1,
              borderWidth: 1,
              borderColor: C.b1,
              borderRadius: 10,
              padding: 14,
              marginBottom: 8,
              opacity: isConnected ? 1 : 0.45,
            })}
          >
            {section.icon}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: C.text,
                  fontSize: 13,
                  fontFamily: "monospace",
                  fontWeight: "600",
                  marginBottom: 2,
                }}
              >
                {section.label}
              </Text>
              <Text
                style={{
                  color: C.dim,
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {section.desc}
              </Text>
            </View>
            {!isConnected ? (
              <Lock size={13} color={C.dim} />
            ) : (
              <ChevronRight size={13} color={C.dim} />
            )}
          </Pressable>
        ))}

        {!isConnected ? (
          <Text
            style={{
              color: C.dim,
              fontSize: 10,
              fontFamily: "monospace",
              textAlign: "center",
              marginTop: 8,
              letterSpacing: 1,
            }}
          >
            Connect RevenueCat to unlock payment features
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
