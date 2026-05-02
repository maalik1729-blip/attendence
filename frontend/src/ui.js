import { useTheme } from './ThemeContext';
import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';


export function Button({ title, onPress, loading, variant = 'primary', style, disabled }) {
  const { theme: COLORS } = useTheme();
  const styles = getStyles(COLORS);
  const bg =
    variant === 'danger'
      ? COLORS.danger
      : variant === 'success'
      ? COLORS.success
      : variant === 'outline'
      ? 'transparent'
      : COLORS.primary;
  const fg = variant === 'outline' ? COLORS.primary : '#fff';
  const border = variant === 'outline' ? { borderWidth: 1, borderColor: COLORS.primary } : null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        border,
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.btnText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }) {
  const { theme: COLORS } = useTheme();
  const styles = getStyles(COLORS);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({ label, children, error }) {
  const { theme: COLORS } = useTheme();
  const styles = getStyles(COLORS);
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Screen({ children, style }) { const { theme: COLORS } = useTheme(); const styles = getStyles(COLORS); return <View style={[[styles.screen, style], { paddingTop: 40, paddingBottom: 40 }]}>{children}</View>; }

const getStyles = (COLORS) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 4 },
  error: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
});

export const getInputStyle = (COLORS) => ({
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: COLORS.border,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: COLORS.text,
  fontSize: 15,
});
