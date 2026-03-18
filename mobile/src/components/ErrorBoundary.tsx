import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { C } from "@/theme/colors";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console only — no stack traces exposed to UI
    console.error("ErrorBoundary caught:", error.message, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: C.bg,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Text
            style={{
              color: C.red,
              fontSize: 16,
              fontFamily: "monospace",
              fontWeight: "bold",
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            SOMETHING WENT WRONG
          </Text>
          <Text
            style={{
              color: C.dim,
              fontSize: 12,
              fontFamily: "monospace",
              textAlign: "center",
              lineHeight: 20,
              marginBottom: 24,
            }}
          >
            {this.state.error?.message ?? "An unexpected error occurred"}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: C.cy,
              backgroundColor: C.cy + "18",
            }}
          >
            <Text
              style={{
                color: C.cy,
                fontSize: 13,
                fontFamily: "monospace",
                fontWeight: "700",
                letterSpacing: 1,
              }}
            >
              TRY AGAIN
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
