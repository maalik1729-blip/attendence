import { useTheme } from '../ThemeContext';
import React, { useCallback, useState } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { Button, Card, Screen } from '../ui';


function Stat({ label, value, color }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: color || COLORS.text }}>{value}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export default function AdminHomeScreen({ navigation }) {
  const { theme: COLORS } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setStats(await api.adminStats()); } catch { /* ignore */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <Screen style={{ justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></Screen>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.bg }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
        Admin dashboard
      </Text>

      <Card>
        <Text style={{ color: COLORS.muted, marginBottom: 10 }}>Employees</Text>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Total" value={stats?.employees.total ?? 0} />
          <Stat label="Approved" value={stats?.employees.approved ?? 0} color={COLORS.success} />
          <Stat label="Pending" value={stats?.employees.pending ?? 0} color={COLORS.warning} />
          <Stat label="Rejected" value={stats?.employees.rejected ?? 0} color={COLORS.danger} />
        </View>
      </Card>

      <Card>
        <Text style={{ color: COLORS.muted, marginBottom: 10 }}>Today ({stats?.today.date})</Text>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Present" value={stats?.today.present ?? 0} color={COLORS.success} />
          <Stat label="Late" value={stats?.today.late ?? 0} color={COLORS.warning} />
          <Stat label="Absent" value={Math.max(0, stats?.today.absent ?? 0)} color={COLORS.danger} />
        </View>
      </Card>

      <Button title="Review registration requests" onPress={() => navigation.navigate('AdminRequests')} />
      <View style={{ height: 10 }} />
      <Button title="Manage employees" variant="outline" onPress={() => navigation.navigate('AdminEmployees')} />
    </ScrollView>
  );
}
