import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Transcription: { imageBase64: string };
};

export default function CameraScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  const navigateWithImage = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      navigation.navigate('Transcription', { imageBase64: base64 });
    } catch (err) {
      Alert.alert('Error', 'Failed to read image file.');
      console.error(err);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo?.uri) {
        await navigateWithImage(photo.uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo.');
      console.error(err);
    } finally {
      setCapturing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          navigation.navigate('Transcription', { imageBase64: asset.base64 });
        } else if (asset.uri) {
          await navigateWithImage(asset.uri);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image from gallery.');
      console.error(err);
    }
  };

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6c5ce7" />
      </View>
    );
  }

  // Permission denied — show gallery fallback
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera access is required for capture.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handlePickImage}
        >
          <Text style={styles.buttonText}>📁 Pick from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            Position handwritten text in frame
          </Text>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePickImage}
          >
            <Text style={styles.buttonText}>📁 Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shutterButton}
            onPress={handleCapture}
            disabled={capturing}
            activeOpacity={0.7}
          >
            {capturing ? (
              <ActivityIndicator color="#1a1a2e" />
            ) : (
              <View style={styles.shutterInner} />
            )}
          </TouchableOpacity>

          <View style={{ width: 80 }} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6c5ce7',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  message: {
    color: '#a0a0cc',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: 'rgba(108, 92, 231, 0.6)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
