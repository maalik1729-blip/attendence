import { useTheme } from '../ThemeContext';
import React, { useCallback, useState } from 'react';
import { Text, View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { Card, Screen } from '../ui';


export default function ReportsScreen() {
  const { theme: COLORS } = useTheme();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { records: r } = await api.myAttendance();
      setRecords(r || []);
    } catch {
      // noop
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <Screen style={{ justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></Screen>;
  }

  return (
    <FlatList
      style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16 }}
      data={records}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
          My attendance
        </Text>
      }
      ListEmptyComponent={
        <Card><Text style={{ color: COLORS.muted }}>No attendance records yet.</Text></Card>
      }
      renderItem={({ item }) => (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>{item.date}</Text>
            <Text
              style={{
                color: item.status === 'late' ? COLORS.warning : COLORS.success,
                fontWeight: '600',
                textTransform: 'capitalize',
              }}
            >
              {item.status}
            </Text>
          </View>
          <Text style={{ color: COLORS.muted, marginTop: 4 }}>
            Check-in {new Date(item.checkInAt).toLocaleTimeString()}
          </Text>
        </Card>
      )}
    />
  );
}
