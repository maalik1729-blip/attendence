import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../api';
import { Button } from '../ui';
import { COLORS } from '../config';

/**
 * AdminFaceRegisterScreen
 *
 * Opens the front camera, auto-captures a photo, then submits it to
 * POST /api/admin/employees/:id/face to enroll the employee's reference face.
 *
 * Route params: { employeeId, employeeName }
 */
export default function AdminFaceRegisterScreen({ route, navigation }) {
  const { employeeId, employeeName } = route.params ?? {};

  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [autoCaptured, setAutoCaptured] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
    })();
  }, [permission, requestPermission]);

  const onCameraReady = async () => {
    if (autoCaptured || photo) return;
    setAutoCaptured(true);
    try {
      const shot = await cameraRef.current?.takePictureAsync({
        quality: 0.8,
        skipProcessing: true,
      });
      if (shot?.uri) setPhoto(shot);
    } catch (err) {
      Alert.alert('Camera error', err.message);
    }
  };

  const retake = () => {
    setPhoto(null);
    setAutoCaptured(false);
  };

  const submit = async () => {
    if (!photo) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('photo', {
        uri: photo.uri,
        name: `face-${employeeId}-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      await api.enrollFace(employeeId, form);
      Alert.alert(
        'Success',
        `Face registered for ${employeeName}. They can now check in with face recognition.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not enroll face. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text }}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text, marginBottom: 12, textAlign: 'center' }}>
          Camera access is required to register a face.
        </Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Info banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Register Face</Text>
        <Text style={styles.bannerSub}>{employeeName}</Text>
        <Text style={styles.bannerHint}>
          Position employee's face clearly in the frame, then hold steady.
        </Text>
      </View>

      {/* Camera / preview */}
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

      {/* Face guide overlay (shown when camera is live) */}
      {!photo && (
        <View style={styles.guideOverlay} pointerEvents="none">
          <View style={styles.guideOval} />
        </View>
      )}

      {/* Action bar */}
      <View style={styles.bar}>
        {photo ? (
          <>
            <Button
              title="Retake"
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
              onPress={retake}
            />
            <Button
              title="Register Face"
              style={{ flex: 1 }}
              onPress={submit}
              loading={submitting}
            />
          </>
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', flex: 1, fontSize: 15 }}>
            Hold steady — capturing…
          </Text>
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
    padding: 24,
  },
  banner: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 14,
    paddingTop: 20,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bannerSub: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerHint: {
    color: '#aaa',
    fontSize: 13,
    marginTop: 4,
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideOval: {
    width: 200,
    height: 260,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.55)',
    marginTop: 60,
  },
  bar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
});
