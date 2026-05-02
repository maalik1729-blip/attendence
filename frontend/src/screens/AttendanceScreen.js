import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import * as Location from 'expo-location';
import { api } from '../api';
import { Button } from '../ui';
import { COLORS } from '../config';
import { useAuth } from '../AuthContext';

export default function AttendanceScreen({ navigation }) {
  const { mustChangePassword } = useAuth();
  
  // Vision Camera hooks
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    })();
  }, [hasPermission, requestPermission]);

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const shot = await cameraRef.current.takePhoto({
        qualityPrioritization: 'balanced',
      });
      if (shot?.path) {
        setPhoto({ uri: `file://${shot.path}` });
      }
    } catch (err) {
      Alert.alert('Camera error', 'Could not capture photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
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

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text, marginBottom: 12 }}>
          Camera access is required to mark attendance.
        </Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text }}>No front camera found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={{ flex: 1 }} resizeMode="cover" />
      ) : (
        <>
          <Camera
            ref={cameraRef}
            style={{ flex: 1 }}
            device={device}
            isActive={!photo}
            photo={true}
          />
          
          <View style={styles.ovalWrap} pointerEvents="none">
            <View style={[styles.oval, styles.ovalIdle]} />
          </View>
        </>
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
              Position face and tap to capture
            </Text>
            <Pressable
              onPress={takePhoto}
              disabled={capturing}
              style={[styles.shutter, capturing && { opacity: 0.4 }]}
            >
              <View style={styles.shutterInner} />
            </Pressable>
          </View>
        )}
      </View>
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
