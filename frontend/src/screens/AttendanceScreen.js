import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Location from 'expo-location';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as blazeface from '@tensorflow-models/blazeface';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { api } from '../api';
import { Button } from '../ui';
import { COLORS } from '../config';
import { useAuth } from '../AuthContext';

export default function AttendanceScreen({ navigation }) {
  const { mustChangePassword } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  const captureTriggered = useRef(false);
  const cameraRef = useRef(null);
  const modelRef = useRef(null);
  const intervalRef = useRef(null);
  const detectingRef = useRef(false);

  // ── Load TF.js + BlazeFace model on mount ──────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      await tf.ready();
      const m = await blazeface.load();
      if (mounted) {
        modelRef.current = m;
        setModelReady(true);
      }
    })();
    return () => {
      mounted = false;
      stopDetection();
    };
  }, []);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
    })();
  }, [permission, requestPermission]);

  // ── Start/stop detection loop ───────────────────────────────────────────────
  const stopDetection = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const detectFace = useCallback(async () => {
    if (!cameraRef.current || captureTriggered.current || detectingRef.current) return;
    detectingRef.current = true;
    try {
      // Take low-quality snapshot for fast inference
      const snap = await cameraRef.current.takePictureAsync({ quality: 0.25 });
      if (!snap?.uri) return;

      // Read as base64
      const b64 = await FileSystem.readAsStringAsync(snap.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Decode to tensor
      const binaryStr = atob(b64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const tensor = decodeJpeg(bytes);

      // Run BlazeFace inference
      const predictions = await modelRef.current.estimateFaces(tensor, false);
      tf.dispose(tensor);

      const detected = predictions && predictions.length > 0;
      setFaceDetected(detected);

      if (detected && !captureTriggered.current) {
        captureTriggered.current = true;
        stopDetection();
        // Capture full-quality photo
        const fullShot = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (fullShot?.uri) setPhoto(fullShot);
      }
    } catch {
      // Skip this frame silently
    } finally {
      detectingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!cameraReady || !modelReady || photo) return;
    intervalRef.current = setInterval(detectFace, 500);
    return stopDetection;
  }, [cameraReady, modelReady, photo, detectFace]);

  // ── Retake ─────────────────────────────────────────────────────────────────
  const retake = () => {
    setPhoto(null);
    setFaceDetected(false);
    captureTriggered.current = false;
  };

  // ── Submit attendance ──────────────────────────────────────────────────────
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
      Alert.alert('Success', 'Attendance marked ✓', [
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

  // ── Permission states ──────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {photo ? (
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
              title="Submit"
              style={{ flex: 1 }}
              onPress={submit}
              loading={submitting}
            />
          </View>
        </>
      ) : (
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

          {/* Status bar */}
          <View style={styles.bar}>
            {!modelReady ? (
              <View style={styles.loadRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.hint, { marginLeft: 10 }]}>Loading face model…</Text>
              </View>
            ) : (
              <Text style={[styles.hint, faceDetected && styles.hintGreen]}>
                {faceDetected
                  ? '✓ Face detected — capturing…'
                  : 'Position your face in the oval'}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const OVAL_W = width * 0.78;
const OVAL_H = height * 0.55;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    padding: 16,
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
    marginBottom: 80,
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
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  loadRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
