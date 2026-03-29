import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Homeicon from '../assets/icons/home.svg';
import Docicon from '../assets/icons/doc.svg';
import flashicon from '../assets/icons/flashcard.svg';
import profileicon from '../assets/icons/profile.svg';
import Scanicon from '../assets/icons/scan.svg';

type ScreenName = 'Dashboard' | 'Documents';

interface NavItem {
  id: number;
  routeName: ScreenName;
  IconComponent: React.ComponentType<{
    width: number;
    height: number;
    style?: any;
  }>;
  label: string;
}

interface BottomNavigationBarProps {
  onNavigate?: (screen: ScreenName) => void;
}

export function BottomNavigationBar({
  onNavigate,
}: BottomNavigationBarProps) {

  const navItems: NavItem[] = [
    { id: 1, routeName: 'Dashboard', IconComponent: Homeicon, label: 'Home' },
    { id: 2, routeName: 'Dashboard', IconComponent: Docicon, label: 'Chat' },
    { id: 3, routeName: 'Dashboard', IconComponent: Scanicon, label: 'Scan' },
    { id: 4, routeName: 'Dashboard', IconComponent: flashicon, label: 'Flashcard' },
    { id: 5, routeName: 'Dashboard', IconComponent: profileicon, label: 'Profile' },
  ];

  const handleNavigation = (screenName: ScreenName) => {
    if (onNavigate) {
      onNavigate(screenName);
    }
  };

  return (
    <View style={styles.bottomNav}>
      {navItems.map(item => {
        const { IconComponent } = item;
        const isCenterItem = item.id === 3;

        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.navItem, isCenterItem && styles.centerNavItem]}
            activeOpacity={0.9}
            onPress={() => handleNavigation(item.routeName)}
          >
            <View
              style={[
                styles.navIconContainer,
                isCenterItem && styles.centerIconContainer,
              ]}
            >
              <IconComponent
                width={isCenterItem ? 36 : 28}
                height={isCenterItem ? 36 : 28}
                style={styles.navIcon}
              />
            </View>
            {!isCenterItem && (
              <Text style={{ fontSize: 10, color: '#333' }}>{item.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

}

const styles = StyleSheet.create({
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#8B9D8A',
    paddingVertical: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 20,
    marginHorizontal: 15,
    position: 'relative',
  },
  navItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  centerNavItem: {
    width: 65,
    height: 0,
    marginBottom: 35,
  },
  navIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 40,
    backgroundColor: '#C5D8C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#8B9D8A',
    borderWidth: 5,
  },
  navIcon: {
    fontSize: 28,
  },
});
