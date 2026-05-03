import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import CameraScreen from '../screens/CameraScreen';
import DocumentScanResultScreen from '../screens/DocumentScanResultScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import { TabScreenWrapper } from './TabScreenWrapper';
import { useAuth } from '../contexts/AuthContext';

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
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    // You can replace this with a proper splash screen
    return (
      <NavigationContainer>
        <></>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={isLoggedIn ? 'TabNavigator' : 'SignIn'}
      >
        {/* Auth Stack */}
        {!isLoggedIn && (
          <Stack.Group>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ animationEnabled: false }}
            />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </Stack.Group>
        )}

        {/* App Stack */}
        {isLoggedIn && (
          <Stack.Group screenOptions={{ animationEnabled: false }}>
            <Stack.Screen name="TabNavigator" component={TabNavigator} />
          </Stack.Group>
        )}

        {/* Modal screens */}
        <Stack.Group
          screenOptions={{
            presentation: 'card',
          }}
        >
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="DocumentScanResult" component={DocumentScanResultScreen} />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
