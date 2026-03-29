import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import React, { useState } from 'react';
import DashboardScreen from './screens/DashboardScreen';
import DocumentsScreen from './screens/DocumentsScreen';

type ScreenName = 'Dashboard' | 'Documents';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Dashboard');

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="#6B9071"
        translucent={false}
      />
      <View style={styles.container}>
        {currentScreen === 'Dashboard' && (
          <DashboardScreen onNavigate={setCurrentScreen} />
        )}
        {currentScreen === 'Documents' && (
          <DocumentsScreen onNavigate={setCurrentScreen} />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
