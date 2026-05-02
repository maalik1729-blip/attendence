import { useTheme } from '../ThemeContext';
import React, { useCallback, useState } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Card, Screen } from '../ui';


function Stat({ label, value, color }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: color || COLORS.text }}>{value}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { theme: COLORS } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState(null);
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([api.mySummary(), api.today()]);
      setSummary(s);
      setToday(t.attendance);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </Screen>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: COLORS.bg, paddingTop: insets.top }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }
    >
      <Text style={{ fontSize: 14, color: COLORS.muted }}>Welcome back,</Text>
      <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
        {user?.firstName} {user?.lastName}
      </Text>

      <Card>
        <Text style={{ fontSize: 14, color: COLORS.muted, marginBottom: 6 }}>Today's status</Text>
        {today ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: '600', color: COLORS.success }}>
              Marked — {today.status === 'late' ? 'Late' : 'Present'}
            </Text>
            <Text style={{ color: COLORS.muted, marginTop: 4 }}>
              Check-in: {new Date(today.checkInAt).toLocaleTimeString()}
            </Text>
          </>
        ) : (
          <Text style={{ fontSize: 16, color: COLORS.warning }}>
            Not marked yet — tap the camera in the tab bar to check in.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={{ fontSize: 14, color: COLORS.muted, marginBottom: 10 }}>Your attendance</Text>
        <View style={{ flexDirection: 'row' }}>
          <Stat label="Total" value={summary?.total ?? 0} />
          <Stat label="This month" value={summary?.monthCount ?? 0} color={COLORS.primary} />
          <Stat label="Present" value={summary?.present ?? 0} color={COLORS.success} />
          <Stat label="Late" value={summary?.late ?? 0} color={COLORS.warning} />
        </View>
      </Card>

      <Card>
        <Text style={{ fontSize: 14, color: COLORS.muted }}>Tip</Text>
        <Text style={{ fontSize: 15, color: COLORS.text, marginTop: 4 }}>
          Make sure your face is clearly visible and well-lit when you check in.
        </Text>
      </Card>
    </ScrollView>
  );
}
