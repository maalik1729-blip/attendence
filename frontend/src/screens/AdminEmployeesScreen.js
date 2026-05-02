import React, { useCallback, useState } from 'react';
import {
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Button, Card, Screen } from '../ui';
import { COLORS } from '../config';

export default function AdminEmployeesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { employees } = await api.adminEmployees();
      setItems(employees);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (id) => {
    Alert.alert('Remove employee', 'This will delete all their attendance too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.removeEmployee(id);
            await load();
          } catch (err) {
            Alert.alert('Failed', err.message);
          }
        },
      },
    ]);
  };

  const registerFace = (item) => {
    navigation.navigate('AdminFaceRegister', {
      employeeId: item._id,
      employeeName: `${item.firstName} ${item.lastName}`,
    });
  };

  if (loading) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(i) => i._id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
        />
      }
      ListHeaderComponent={
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
          Employees
        </Text>
      }
      ListEmptyComponent={
        <Card>
          <Text style={{ color: COLORS.muted }}>No employees yet.</Text>
        </Card>
      }
      renderItem={({ item }) => (
        <Card>
          {/* Name + status row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 }}>
              {item.firstName} {item.lastName}
            </Text>
            <Text
              style={{
                color:
                  item.status === 'approved'
                    ? COLORS.success
                    : item.status === 'pending'
                    ? COLORS.warning
                    : COLORS.danger,
                fontWeight: '600',
                textTransform: 'capitalize',
                marginLeft: 8,
              }}
            >
              {item.status}
            </Text>
          </View>

          <Text style={{ color: COLORS.muted }}>@{item.username} · {item.mobile}</Text>
          <Text style={{ color: COLORS.muted, marginBottom: 10 }}>{item.email}</Text>

          {/* Face enrollment status */}
          <View style={styles.faceRow}>
            {item.faceImageUrl ? (
              <>
                <Image
                  source={{ uri: item.faceImageUrl }}
                  style={styles.faceThumbnail}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.faceRegistered}>✓ Face registered</Text>
                  <Text style={styles.faceSub}>
                    Re-register to update reference photo.
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ flex: 1 }}>
                <Text style={styles.faceNotRegistered}>⚠ No face registered</Text>
                <Text style={styles.faceSub}>
                  Employee cannot check in until face is registered.
                </Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Button
              title={item.faceImageUrl ? 'Update Face' : 'Register Face'}
              style={{ flex: 1, marginRight: 8 }}
              onPress={() => registerFace(item)}
            />
            <Button
              title="Remove"
              variant="danger"
              style={{ flex: 1 }}
              onPress={() => remove(item._id)}
            />
          </View>
        </Card>
      )}
    />
  );
}

const styles = {
  faceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  faceThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ddd',
  },
  faceRegistered: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 13,
  },
  faceNotRegistered: {
    color: COLORS.warning,
    fontWeight: '700',
    fontSize: 13,
  },
  faceSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
};
