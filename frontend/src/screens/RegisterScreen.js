import { useTheme } from '../ThemeContext';
import React, { useState } from 'react';
import { Text, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { api } from '../api';
import { Button, Card, Field, Screen, inputStyle } from '../ui';


export default function RegisterScreen({ navigation }) {
  const { theme: COLORS } = useTheme();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    mobile: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    const { firstName, lastName, username, mobile, email } = form;
    if (!firstName || !lastName || !username || !mobile || !email) {
      Alert.alert('Missing', 'All fields are required');
      return;
    }
    setLoading(true);
    try {
      await api.register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        mobile: mobile.trim(),
        email: email.trim().toLowerCase(),
      });
      Alert.alert(
        'Request sent',
        'Your registration request was sent to the administrator. You will receive an email with your credentials once approved.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Registration failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView>
        <Screen>
          <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>
            Employee registration
          </Text>
          <Text style={{ color: COLORS.muted, marginBottom: 16 }}>
            An admin will review your request and email you a password.
          </Text>
          <Card>
            <Field label="First name">
              <TextInput style={inputStyle} value={form.firstName} onChangeText={set('firstName')} />
            </Field>
            <Field label="Last name">
              <TextInput style={inputStyle} value={form.lastName} onChangeText={set('lastName')} />
            </Field>
            <Field label="Username">
              <TextInput
                style={inputStyle}
                autoCapitalize="none"
                value={form.username}
                onChangeText={set('username')}
              />
            </Field>
            <Field label="Mobile (10 digits)">
              <TextInput
                style={inputStyle}
                keyboardType="phone-pad"
                maxLength={10}
                value={form.mobile}
                onChangeText={set('mobile')}
              />
            </Field>
            <Field label="Email">
              <TextInput
                style={inputStyle}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={set('email')}
              />
            </Field>
            <Button title="Submit request" onPress={submit} loading={loading} />
          </Card>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
