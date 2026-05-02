import { useTheme } from '../ThemeContext';
import React, { useState } from 'react';
import { Text, TextInput, View, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useAuth } from '../AuthContext';
import { Button, Card, Field, Screen, inputStyle } from '../ui';


export default function LoginScreen({ navigation }) {
  const { theme: COLORS } = useTheme();
  const { signIn } = useAuth();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!mobile || !password) {
      Alert.alert('Missing', 'Enter your mobile and password');
      return;
    }
    setLoading(true);
    try {
      await signIn({ mobile: mobile.trim(), password });
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Screen style={{ justifyContent: 'center' }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>
            Welcome back
          </Text>
          <Text style={{ color: COLORS.muted, marginBottom: 24 }}>
            Sign in with your registered mobile number.
          </Text>
          <Card>
            <Field label="Mobile number">
              <TextInput
                keyboardType="phone-pad"
                maxLength={10}
                value={mobile}
                onChangeText={setMobile}
                placeholder="10-digit mobile"
                style={inputStyle}
              />
            </Field>
            <Field label="Password">
              <TextInput
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                style={inputStyle}
              />
            </Field>
            <Button title="Sign in" onPress={submit} loading={loading} />
            <View style={{ height: 10 }} />
            <Button
              title="Create an employee account"
              variant="outline"
              onPress={() => navigation.navigate('Register')}
            />
          </Card>
        </Screen>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
