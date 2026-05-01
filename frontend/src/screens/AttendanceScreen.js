import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, Image, Platform } from 'react-native';
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
  const [autoCaptured, setAutoCaptured] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!permission?.granted) await requestPermission();
    })();
  }, [permission, requestPermission]);

  // Automatically take a photo once the camera is ready (per requirement:
  // "open camera automatically take a photo").
  const onCameraReady = async () => {
    if (autoCaptured || photo) return;
    setAutoCaptured(true);
    try {
      const shot = await cameraRef.current?.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (shot?.uri) setPhoto(shot);
    } catch (err) {
      Alert.alert('Camera error', err.message);
    }
  };

  const retake = async () => {
    setPhoto(null);
    setAutoCaptured(false);
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
      // If a descriptor-capture native module is integrated, attach here:
      // form.append('descriptor', JSON.stringify(descriptorArray));

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

  if (!permission) return <View style={styles.center}><Text>Requesting permission…</Text></View>;
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
          <Text style={{ color: '#fff', textAlign: 'center', flex: 1 }}>
            Hold steady — taking photo…
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, padding: 16 },
  bar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
});
