import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import { BottomNavigationBar } from '../components/BottomNavigationBar';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // Ẩn tab bar mặc định
        }}
        tabBar={props => <BottomNavigationBar />}
      >
        <Tab.Screen
          name="Home"
          component={DashboardScreen}
          options={{ title: 'Home' }}
        />
        <Tab.Screen
          name="Chat"
          component={DashboardScreen}
          options={{ title: 'Chat' }}
        />
        <Tab.Screen
          name="Scan"
          component={DashboardScreen}
          options={{ title: 'Scan' }}
        />
        <Tab.Screen
          name="Flashcard"
          component={DashboardScreen}
          options={{ title: 'Flashcard' }}
        />
        <Tab.Screen
          name="Profile"
          component={DashboardScreen}
          options={{ title: 'Profile' }}
        />
        {/* Nested Screen cho Documents (không show trong tab) */}
        <Tab.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{ title: 'Documents' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
