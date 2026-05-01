import React, { useCallback, useState } from 'react';
import { Text, View, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Button, Card, Screen } from '../ui';
import { COLORS } from '../config';

export default function AdminEmployeesScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { const { employees } = await api.adminEmployees(); setItems(employees); }
    catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (id) => {
    Alert.alert('Remove employee', 'This will delete all their attendance too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await api.removeEmployee(id); await load(); }
          catch (err) { Alert.alert('Failed', err.message); }
        },
      },
    ]);
  };

  if (loading) {
    return <Screen style={{ justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></Screen>;
  }

  return (
    <FlatList
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(i) => i._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>Employees</Text>
      }
      ListEmptyComponent={<Card><Text style={{ color: COLORS.muted }}>No employees yet.</Text></Card>}
      renderItem={({ item }) => (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={{ color:
              item.status === 'approved' ? COLORS.success
              : item.status === 'pending' ? COLORS.warning
              : COLORS.danger, fontWeight: '600', textTransform: 'capitalize' }}>
              {item.status}
            </Text>
          </View>
          <Text style={{ color: COLORS.muted }}>@{item.username} · {item.mobile}</Text>
          <Text style={{ color: COLORS.muted, marginBottom: 8 }}>{item.email}</Text>
          <Button title="Remove" variant="danger" onPress={() => remove(item._id)} />
        </Card>
      )}
    />
  );
}
