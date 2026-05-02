import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { api } from '../api';
import { Button } from '../ui';
import { COLORS } from '../config';

/**
 * AdminFaceRegisterScreen
 * Opens the front camera with live face detection.
 * When a face is detected the oval turns green and the photo is auto-captured.
 * Admin can then Submit or Retake.
 *
 * Route params: { employeeId, employeeName }
 */
export default function AdminFaceRegisterScreen({ route, navigation }) {
  const { employeeId, employeeName } = route.params ?? {};

  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const captureTriggered = useRef(false);
  const cameraRef = useRef(null);

  const detectingRef = useRef(false);
  const intervalRef = useRef(null);

  const detectFaceLoop = async () => {
    if (!cameraRef.current || captureTriggered.current || detectingRef.current || !cameraReady || photo) return;
    detectingRef.current = true;
    try {
      const snap = await cameraRef.current.takePictureAsync({ quality: 0.1, skipProcessing: true });
      if (!snap?.uri) return;

      const result = await FaceDetector.detectFacesAsync(snap.uri, {
        mode: FaceDetector.FaceDetectorMode.fast,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
      });

      const detected = result && result.faces && result.faces.length > 0;
      setFaceDetected(detected);

      if (detected && !captureTriggered.current) {
        captureTriggered.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        const fullShot = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (fullShot?.uri) setPhoto(fullShot);
      }
    } catch (e) {
      // ignore
    } finally {
      detectingRef.current = false;
    }
  };

  React.useEffect(() => {
    if (cameraReady && !photo) {
      intervalRef.current = setInterval(detectFaceLoop, 800);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cameraReady, photo]);

  const retake = () => {
    setPhoto(null);
    setFaceDetected(false);
    captureTriggered.current = false;
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
        'Face Registered ✓',
        `${employeeName} can now check in with face recognition.`,
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
          Position the employee's face in the oval to auto-capture.
        </Text>
      </View>

      {photo ? (
        /* ── Captured preview ── */
        <>
          <Image source={{ uri: photo.uri }} style={{ flex: 1 }} resizeMode="cover" />
          <View style={styles.ovalWrap} pointerEvents="none">
            <View style={[styles.oval, styles.ovalGreen]} />
          </View>
          <View style={styles.bar}>
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
          </View>
        </>
      ) : (
        /* ── Live camera ── */
        <>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="front"
            onCameraReady={() => setCameraReady(true)}
          />

          {/* Oval face guide */}
          <View style={styles.ovalWrap} pointerEvents="none">
            <View style={[styles.oval, faceDetected ? styles.ovalGreen : styles.ovalIdle]} />
          </View>

          {/* Status */}
          <View style={styles.bar}>
            <Text style={[styles.hint, faceDetected && styles.hintGreen]}>
              {faceDetected ? '✓ Face detected — capturing…' : 'Position face in the oval'}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const OVAL_W = width * 0.78;
const OVAL_H = height * 0.50; // slightly smaller to account for the top banner

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
  ovalWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oval: {
    width: OVAL_W,
    height: OVAL_H,
    borderRadius: OVAL_W / 2,
    borderWidth: 3,
    marginTop: 60,
  },
  ovalIdle: {
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ovalGreen: {
    borderColor: '#00e676',
    shadowColor: '#00e676',
    shadowOpacity: 0.9,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  hint: {
    flex: 1,
    color: '#aaa',
    fontSize: 15,
    textAlign: 'center',
  },
  hintGreen: {
    color: '#00e676',
    fontWeight: '700',
  },
});
