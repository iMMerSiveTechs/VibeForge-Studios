import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import TranscriptionScreen from './src/screens/TranscriptionScreen';
import CorrectionScreen from './src/screens/CorrectionScreen';
import GlyphMapScreen from './src/screens/GlyphMapScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#16213e' },
  headerTintColor: '#e0e0ff',
  headerTitleStyle: { fontWeight: '600' as const },
};

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#16213e',
          borderTopColor: '#0f3460',
        },
        tabBarActiveTintColor: '#6c5ce7',
        tabBarInactiveTintColor: '#666690',
        ...screenOptions,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'DecipherKit',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>✒️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          title: 'Capture',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📷</Text>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📜</Text>
          ),
        }}
      />
      <Tab.Screen
        name="GlyphMap"
        component={GlyphMapScreen}
        options={{
          title: 'Glyph Map',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🔤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen
          name="Tabs"
          component={HomeTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Transcription"
          component={TranscriptionScreen}
          options={{ title: 'Transcription' }}
        />
        <Stack.Screen
          name="Correction"
          component={CorrectionScreen}
          options={{ title: 'Correct & Teach' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
