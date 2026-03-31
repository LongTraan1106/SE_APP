import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import CameraScreen from '../screens/CameraScreen';
import { TabScreenWrapper } from './TabScreenWrapper';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Wrapper để thêm BottomNavigationBar vào mỗi tab screen
const WrappedDashboard = () => (
  <TabScreenWrapper>
    <DashboardScreen />
  </TabScreenWrapper>
);

const WrappedDocuments = () => (
  <TabScreenWrapper>
    <DocumentsScreen />
  </TabScreenWrapper>
);

// Bottom Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      sceneContainerStyle={{ backgroundColor: '#E3EED4' }}
    >
      <Tab.Screen
        name="Home"
        component={WrappedDashboard}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Documents"
        component={WrappedDocuments}
        options={{ title: 'Documents' }}
      />
      <Tab.Screen
        name="Flashcard"
        component={WrappedDashboard}
        options={{ title: 'Flashcard' }}
      />
      <Tab.Screen
        name="Profile"
        component={WrappedDashboard}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Root Stack Navigator
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
          cardStyle: { backgroundColor: '#E3EED4' },
        }}
      >
        <Stack.Group>
          <Stack.Screen name="TabNavigator" component={TabNavigator} />
        </Stack.Group>

        {/* Modal screens */}
        <Stack.Group
          screenOptions={{
            presentation: 'card',
          }}
        >
          <Stack.Screen name="Camera" component={CameraScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
