import { useTheme } from '../ThemeContext';
import React, { useCallback, useState } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Card, Screen } from '../ui';


function Stat({ label, value, color, COLORS }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: color || COLORS.text }}>{value}</Text>
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function HotelPoster({ COLORS }) {
  return (
    <View style={[styles.posterContainer, { backgroundColor: '#2563eb' }]}>
      <View style={styles.posterContent}>
        <View style={styles.posterHeader}>
          <Text style={styles.posterEmoji}>🏨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.posterTitle}>Excellence in Hospitality</Text>
            <Text style={styles.posterSubtitle}>Your dedication makes every guest feel at home</Text>
          </View>
        </View>
        
        <View style={styles.posterStats}>
          <View style={styles.posterStatItem}>
            <Text style={styles.posterStatIcon}>⭐</Text>
            <Text style={styles.posterStatText}>5-Star Service</Text>
          </View>
          <View style={styles.posterStatItem}>
            <Text style={styles.posterStatIcon}>👥</Text>
            <Text style={styles.posterStatText}>Team Excellence</Text>
          </View>
          <View style={styles.posterStatItem}>
            <Text style={styles.posterStatIcon}>🎯</Text>
            <Text style={styles.posterStatText}>Guest Satisfaction</Text>
          </View>
        </View>

        <View style={styles.posterFooter}>
          <Text style={styles.posterQuote}>
            "Hospitality is making your guests feel at home, even if you wish they were."
          </Text>
        </View>
      </View>
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

      {/* Hotel Poster Banner */}
      <HotelPoster COLORS={COLORS} />

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
          <Stat label="Total" value={summary?.total ?? 0} COLORS={COLORS} />
          <Stat label="This month" value={summary?.monthCount ?? 0} color={COLORS.primary} COLORS={COLORS} />
          <Stat label="Present" value={summary?.present ?? 0} color={COLORS.success} COLORS={COLORS} />
          <Stat label="Late" value={summary?.late ?? 0} color={COLORS.warning} COLORS={COLORS} />
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

const styles = StyleSheet.create({
  posterContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    padding: 20,
  },
  posterContent: {
    gap: 16,
  },
  posterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  posterEmoji: {
    fontSize: 48,
  },
  posterTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  posterSubtitle: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
  },
  posterStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  posterStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  posterStatIcon: {
    fontSize: 24,
  },
  posterStatText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  posterFooter: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffffff',
  },
  posterQuote: {
    fontSize: 13,
    color: '#ffffff',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
