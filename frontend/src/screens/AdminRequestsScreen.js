import React, { useCallback, useState } from 'react';
import { Text, View, FlatList, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Button, Card, Screen } from '../ui';
import { COLORS } from '../config';

export default function AdminRequestsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    try {
      const { users } = await api.adminRequests('pending');
      setItems(users);
    } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const decide = async (id, action) => {
    setPending(id + action);
    try {
      await api.decideRequest(id, action);
      await load();
      Alert.alert('Done', action === 'approve' ? 'Approved and emailed' : 'Rejected');
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setPending(null);
    }
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
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
          Pending requests
        </Text>
      }
      ListEmptyComponent={<Card><Text style={{ color: COLORS.muted }}>No pending requests.</Text></Card>}
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
            {item.firstName} {item.lastName} (@{item.username})
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 2 }}>{item.email}</Text>
          <Text style={{ color: COLORS.muted }}>Mobile: {item.mobile}</Text>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Button
              title="Approve"
              variant="success"
              style={{ flex: 1, marginRight: 8 }}
              loading={pending === item._id + 'approve'}
              onPress={() => decide(item._id, 'approve')}
            />
            <Button
              title="Reject"
              variant="danger"
              style={{ flex: 1 }}
              loading={pending === item._id + 'reject'}
              onPress={() => decide(item._id, 'reject')}
            />
          </View>
        </Card>
      )}
    />
  );
}
