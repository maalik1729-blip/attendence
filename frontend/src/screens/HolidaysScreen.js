import { useTheme } from '../ThemeContext';
import React, { useCallback, useState, useMemo } from 'react';
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { Card, Screen } from '../ui';


export default function HolidaysScreen() {
  const { theme: COLORS } = useTheme();
  const insets = useSafeAreaInsets();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const load = useCallback(async () => {
    try {
      const { holidays: h } = await api.holidays(currentYear);
      setHolidays(h || []);
    } catch {
      // noop
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentYear]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Parse holiday dates and create a map
  const holidayMap = useMemo(() => {
    const map = {};
    holidays.forEach(holiday => {
      // Assuming date format is "YYYY-MM-DD" or similar
      const dateKey = holiday.date;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(holiday);
    });
    return map;
  }, [holidays]);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        dateStr,
        holidays: holidayMap[dateStr] || []
      });
    }
    
    return days;
  }, [currentMonth, currentYear, holidayMap]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  // Get holidays for current month
  const currentMonthHolidays = useMemo(() => {
    return holidays.filter(h => {
      const holidayDate = h.date;
      return holidayDate && holidayDate.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    });
  }, [holidays, currentMonth, currentYear]);

  if (loading) {
    return <Screen style={{ justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></Screen>;
  }

  const styles = getStyles(COLORS);
  const today = new Date();
  const isToday = (day) => {
    return day && 
           today.getDate() === day.day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

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
      <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 16 }}>
        Holidays Calendar
      </Text>

      {/* Month Navigation */}
      <Card>
        <View style={styles.monthNav}>
          <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={{ fontSize: 20, color: COLORS.primary }}>‹</Text>
          </Pressable>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <Pressable onPress={goToToday}>
              <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 2 }}>Today</Text>
            </Pressable>
          </View>
          
          <Pressable onPress={goToNextMonth} style={styles.navButton}>
            <Text style={{ fontSize: 20, color: COLORS.primary }}>›</Text>
          </Pressable>
        </View>

        {/* Day Names */}
        <View style={styles.dayNamesRow}>
          {dayNames.map(name => (
            <View key={name} style={styles.dayNameCell}>
              <Text style={styles.dayNameText}>{name}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarData.map((dayData, index) => {
            if (!dayData) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const hasHoliday = dayData.holidays.length > 0;
            const isTodayDate = isToday(dayData);

            return (
              <View 
                key={dayData.dateStr} 
                style={[
                  styles.dayCell,
                  hasHoliday && styles.holidayCell,
                  isTodayDate && styles.todayCell
                ]}
              >
                <Text style={[
                  styles.dayNumber,
                  hasHoliday && { color: COLORS.primary, fontWeight: '700' },
                  isTodayDate && { color: '#fff' }
                ]}>
                  {dayData.day}
                </Text>
                {hasHoliday && (
                  <View style={[styles.holidayDot, { backgroundColor: COLORS.primary }]} />
                )}
              </View>
            );
          })}
        </View>
      </Card>

      {/* Holidays List for Current Month */}
      {currentMonthHolidays.length > 0 ? (
        <>
          <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 }}>
            Holidays this month ({currentMonthHolidays.length})
          </Text>
          {currentMonthHolidays.map(holiday => (
            <Card key={holiday._id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>
                    {holiday.title}
                  </Text>
                  {holiday.description ? (
                    <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 14 }}>
                      {holiday.description}
                    </Text>
                  ) : null}
                  <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 12, textTransform: 'capitalize' }}>
                    {holiday.type}
                  </Text>
                </View>
                <View style={[styles.dateBadge, { backgroundColor: COLORS.primary }]}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                    {new Date(holiday.date).getDate()}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 10 }}>
                    {monthNames[new Date(holiday.date).getMonth()].substring(0, 3)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : (
        <Card style={{ marginTop: 16 }}>
          <Text style={{ color: COLORS.muted, textAlign: 'center' }}>
            No holidays in {monthNames[currentMonth]}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    color: COLORS.text,
  },
  holidayCell: {
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  holidayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 6,
  },
  dateBadge: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});
