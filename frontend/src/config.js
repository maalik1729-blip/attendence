import Constants from 'expo-constants';

/**
 * Configure via app.json `expo.extra.apiBaseUrl`, or override per environment.
 *
 * For Android emulator, the default `10.0.2.2` points to the host machine's
 * localhost. For a physical device, use your LAN IP, e.g. http://192.168.1.50:5000
 */
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  Constants.manifest?.extra?.apiBaseUrl ||
  'http://10.0.2.2:5000';

export const lightColors = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  bg: '#f5f7fb',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  border: '#e2e8f0',
};

export const darkColors = {
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  bg: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
  muted: '#94a3b8',
  danger: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
  border: '#334155',
};

export const COLORS = lightColors;
