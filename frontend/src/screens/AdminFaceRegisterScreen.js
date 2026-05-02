import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { api } from '../api';
import { Button } from '../ui';
import { COLORS } from '../config';

export default function AdminFaceRegisterScreen({ route, navigation }) {
  const { employeeId, employeeName } = route.params ?? {};

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
      Alert.alert('Camera error', 'Could not capture. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
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

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.text, marginBottom: 12, textAlign: 'center' }}>
          Camera access is required to register a face.
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
      {/* Info banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Register Face</Text>
        <Text style={styles.bannerSub}>{employeeName}</Text>
        <Text style={styles.bannerHint}>
          Position the employee's face in the oval to capture.
        </Text>
      </View>

      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={{ flex: 1 }} resizeMode="cover" />
          <View style={styles.ovalWrap} pointerEvents="none">
            <View style={[styles.oval, styles.ovalIdle]} />
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
          <View style={styles.bar}>
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
          </View>
        </>
      )}
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const OVAL_W = width * 0.78;
const OVAL_H = height * 0.50;

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
  bar: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
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
