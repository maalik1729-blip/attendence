import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, Platform, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { api } from '../api';
import { Button } from '../ui';
import { COLORS } from '../config';
import { useAuth } from '../AuthContext';

/**
 * Face-descriptor capture.
 *
 * In a production build, integrate an on-device face-api.js / TFLite model to
 * compute a 128-D descriptor and pass it to the server. This screen captures
 * the photo and posts it; the backend falls back to image-only validation if
 * no descriptor is provided (clearly documented behavior).
 */
export default function AttendanceScreen({ navigation }) {
  const { mustChangePassword } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef(null);
  const autoCaptureTimer = useRef(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
    })();
    return () => {
      // Clear any pending auto-capture timer on unmount
      if (autoCaptureTimer.current) clearTimeout(autoCaptureTimer.current);
    };
  }, [permission, requestPermission]);

  // When camera reports ready, wait 800 ms for hardware to stabilise, then capture.
  const onCameraReady = () => {
    setCameraReady(true);
    if (photo) return; // already have a shot
    autoCaptureTimer.current = setTimeout(() => {
      takePhoto();
    }, 800);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing || photo) return;
    setCapturing(true);
    try {
      // Do NOT use skipProcessing — it causes "Image could not be captured" on many devices
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (shot?.uri) setPhoto(shot);
    } catch (err) {
      Alert.alert('Camera error', 'Could not capture photo. Tap the button below to try manually.');
    } finally {
      setCapturing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
    setCameraReady(false);
    if (autoCaptureTimer.current) clearTimeout(autoCaptureTimer.current);
  };

  const submit = async () => {
    if (!photo) return;
    if (mustChangePassword) {
      Alert.alert(
        'Set a new password',
        'Please change your temporary password in Profile before marking attendance.'
      );
      return;
    }
    setSubmitting(true);
    try {
      let loc = null;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === 'granted') {
          const p = await Location.getCurrentPositionAsync({});
          loc = p.coords;
        }
      } catch { /* optional */ }

      const form = new FormData();
      form.append('photo', {
        uri: photo.uri,
        name: `attendance-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      if (loc) {
        form.append('lat', String(loc.latitude));
        form.append('lng', String(loc.longitude));
      }

      await api.checkIn(form);
      Alert.alert('Success', 'Attendance marked', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (err) {
      const msg = err.data?.code === 'FACE_MISMATCH'
        ? 'Face did not match the enrolled face. Please try again.'
        : err.message;
      Alert.alert('Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text }}>Requesting permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text, marginBottom: 12 }}>
          Camera access is required to mark attendance.
        </Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={{ flex: 1 }} resizeMode="cover" />
      ) : (
        <CameraView
          ref={cameraRef}
          style={{ flex: 1 }}
          facing="front"
          onCameraReady={Platform.OS === 'web' ? undefined : onCameraReady}
        />
      )}

      <View style={styles.bar}>
        {photo ? (
          <>
            <Button title="Retake" variant="outline" style={{ flex: 1, marginRight: 8 }} onPress={retake} />
            <Button title="Submit" style={{ flex: 1 }} onPress={submit} loading={submitting} />
          </>
        ) : (
          <>
            {/* Status text */}
            <Text style={styles.hint}>
              {capturing
                ? 'Capturing…'
                : cameraReady
                ? 'Auto-capturing… or tap 📷'
                : 'Starting camera…'}
            </Text>
            {/* Manual capture button — always visible as fallback */}
            <Pressable
              onPress={takePhoto}
              disabled={!cameraReady || capturing}
              style={[styles.captureBtn, (!cameraReady || capturing) && { opacity: 0.4 }]}
            >
              <Text style={{ fontSize: 26 }}>📷</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    padding: 16,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  hint: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
  captureBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});
