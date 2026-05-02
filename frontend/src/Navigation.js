import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, View, Text, ActivityIndicator, DeviceEventEmitter } from 'react-native';

import { useAuth } from './AuthContext';
import { COLORS } from './config';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ReportsScreen from './screens/ReportsScreen';
import HolidaysScreen from './screens/HolidaysScreen';
import ProfileScreen from './screens/ProfileScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import AdminHomeScreen from './screens/AdminHomeScreen';
import AdminRequestsScreen from './screens/AdminRequestsScreen';
import AdminEmployeesScreen from './screens/AdminEmployeesScreen';
import AdminFaceRegisterScreen from './screens/AdminFaceRegisterScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Icon({ label, focused }) {
  return (
    <Text style={{ color: focused ? COLORS.primary : COLORS.muted, fontSize: 11, fontWeight: '600' }}>
      {label}
    </Text>
  );
}

// Center attendance button — big round accent
function AttendanceTabButton(props) {
  const isFocused = props.accessibilityState?.selected;
  return (
    <Pressable
      onPress={(e) => {
        if (isFocused) {
          DeviceEventEmitter.emit('TAKE_PHOTO');
        } else {
          props.onPress(e);
        }
      }}
      style={{
        top: -15,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 6,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 22 }}>📷</Text>
    </Pressable>
  );
}

function EmployeeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 64, paddingBottom: 8 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon label="HOME" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon label="REPORTS" focused={focused} /> }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: (props) => <AttendanceTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Holidays"
        component={HolidaysScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon label="HOLIDAYS" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon label="PROFILE" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={AdminStack}
        options={{ tabBarIcon: ({ focused }) => <Icon label="DASHBOARD" focused={focused} /> }}
      />
      <Tab.Screen name="Holidays" component={AdminHolidayStack}
        options={{ tabBarIcon: ({ focused }) => <Icon label="HOLIDAYS" focused={focused} /> }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <Icon label="PROFILE" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Admin' }} />
      <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} options={{ title: 'Requests' }} />
      <Stack.Screen name="AdminEmployees" component={AdminEmployeesScreen} options={{ title: 'Employees' }} />
      <Stack.Screen
        name="AdminFaceRegister"
        component={AdminFaceRegisterScreen}
        options={{ title: 'Register Face', headerShown: true }}
      />
    </Stack.Navigator>
  );
}

function AdminHolidayStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HolidaysList" component={HolidaysScreen} options={{ title: 'Holidays' }} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: true, title: 'Register' }}
            />
          </>
        ) : user.role === 'admin' ? (
          <Stack.Screen name="AdminTabs" component={AdminTabs} />
        ) : (
          <Stack.Screen name="EmployeeTabs" component={EmployeeTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
