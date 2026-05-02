import { useTheme } from '../ThemeContext';
import React, { useState } from 'react';
import { Text, TextInput, Alert, ScrollView, View } from 'react-native';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { Button, Card, Field, inputStyle } from '../ui';


export default function ProfileScreen() {
  const { theme: COLORS } = useTheme();
  const { user, signOut, refresh, mustChangePassword, setMustChangePassword } = useAuth();

  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing', 'Fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirm password must match');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      setCurrent(''); setNew(''); setConfirm('');
      setMustChangePassword(false);
      await refresh();
      Alert.alert('Success', 'Password updated');
    } catch (err) {
      Alert.alert('Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 12 }}>
        Profile
      </Text>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={{ color: COLORS.muted, marginTop: 2 }}>@{user?.username}</Text>
        <View style={{ height: 10 }} />
        <Row label="Role" value={user?.role} />
        <Row label="Mobile" value={user?.mobile} />
        <Row label="Email" value={user?.email} />
        <Row label="Status" value={user?.status} />
      </Card>

      {mustChangePassword ? (
        <Card style={{ borderColor: COLORS.warning, borderWidth: 1 }}>
          <Text style={{ color: COLORS.warning, fontWeight: '700' }}>
            You must set a new password to continue.
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10 }}>
          Create a new password
        </Text>
        <Field label="Current password">
          <TextInput style={inputStyle} secureTextEntry value={currentPassword} onChangeText={setCurrent} />
        </Field>
        <Field label="New password">
          <TextInput style={inputStyle} secureTextEntry value={newPassword} onChangeText={setNew} />
        </Field>
        <Field label="Confirm new password">
          <TextInput style={inputStyle} secureTextEntry value={confirmPassword} onChangeText={setConfirm} />
        </Field>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 10 }}>
          Must be 8+ chars with upper, lower and digit.
        </Text>
        <Button title="Update password" onPress={submit} loading={loading} />
      </Card>

      <Card>
        <Button title="Sign out" variant="danger" onPress={signOut} />
      </Card>
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: COLORS.muted }}>{label}</Text>
      <Text style={{ color: COLORS.text, fontWeight: '600', textTransform: 'capitalize' }}>{value}</Text>
    </View>
  );
}
