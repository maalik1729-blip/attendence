import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, Platform, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { api } from '../api';
import { Button } from '../ui';
import { COLORS } from '../config';
import { useAuth } from '../AuthContext';

export default function AttendanceScreen({ navigation }) {
  const { mustChangePassword } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
    })();
  }, [permission, requestPermission]);

  const takePhoto = async () => {
    if (!cameraRef.current || capturing || !cameraReady) return;
    setCapturing(true);
    try {
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (shot?.uri) setPhoto(shot);
    } catch (err) {
      Alert.alert('Camera error', 'Could not capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
    setCameraReady(false);
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
          onCameraReady={() => setCameraReady(true)}
        />
      )}

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
              title="Submit"
              style={{ flex: 1 }}
              onPress={submit}
              loading={submitting}
            />
          </>
        ) : (
          <View style={styles.shutterRow}>
            <Text style={styles.hint}>
              {cameraReady ? 'Tap to capture' : 'Starting camera…'}
            </Text>
            <Pressable
              onPress={takePhoto}
              disabled={!cameraReady || capturing}
              style={[styles.shutter, (!cameraReady || capturing) && { opacity: 0.4 }]}
            >
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
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
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  shutterRow: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    color: '#ccc',
    fontSize: 14,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
