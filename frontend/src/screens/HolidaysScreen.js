import { useTheme } from '../ThemeContext';
import React, { useCallback, useState } from 'react';
import { Text, View, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Card, Screen } from '../ui';


export default function HolidaysScreen() {
  const { theme: COLORS } = useTheme();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const year = new Date().getFullYear();
      const { holidays: h } = await api.holidays(year);
      setHolidays(h || []);
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
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={holidays}
      keyExtractor={(item) => item._id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
          Holidays {new Date().getFullYear()}
        </Text>
      }
      ListEmptyComponent={
        <Card><Text style={{ color: COLORS.muted }}>No holidays configured.</Text></Card>
      }
      renderItem={({ item }) => (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>{item.title}</Text>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>{item.date}</Text>
          </View>
          {item.description ? (
            <Text style={{ color: COLORS.muted, marginTop: 4 }}>{item.description}</Text>
          ) : null}
          <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 12, textTransform: 'capitalize' }}>
            {item.type}
          </Text>
        </Card>
      )}
    />
  );
}
