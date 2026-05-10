import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { SignOutConfirmationModal } from '../components/SignOutConfirmationModal';

function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, logout, loading } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = async () => {
    try {
      setSigningOut(true);
      await logout();
      // Navigation will be handled automatically by RootNavigator
      // when isLoggedIn becomes false
    } catch (error) {
      console.error('Sign out error:', error);
      setSigningOut(false);
      setShowSignOutModal(false);
    }
  };

  const handleCancelSignOut = () => {
    setShowSignOutModal(false);
  };

  const handleEditProfile = () => {
    // TODO: Navigate to Edit Profile screen when created
    // Alert.alert('Edit Profile', 'Edit profile feature coming soon!');
  };

  const initials = user?.username
    ? user.username.substring(0, 1).toUpperCase()
    : 'U';

  // Format role display: capitalize first letter
  const displayRole = user?.role 
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Student';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar + User Info Row */}
          <View style={styles.headerRow}>
            {/* Avatar Circle */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            {/* User Info Section */}
            <View style={styles.userInfoSection}>
              <Text style={styles.nameLabel}>
                {user?.username || 'User'}
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Email: </Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </Text>
              <Text style={styles.infoLine}>
                <Text style={styles.infoLabel}>Role: </Text>
                <Text style={styles.infoValue}>{displayRole}</Text>
              </Text>
            </View>

            {/* Settings Icon */}
            <TouchableOpacity style={styles.settingsIcon}>
              <Text style={styles.settingsText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Statistics Buttons */}
          <View style={styles.statsContainer}>
            <View style={styles.statButton}>
              <Text style={styles.statLabel}>Docs</Text>
              <Text style={styles.statValue}>{user?.documents_count || 0}</Text>
            </View>
            <View style={styles.statButton}>
              <Text style={styles.statLabel}>FlashCard</Text>
              <Text style={styles.statValue}>{user?.flashcards_count || 0}</Text>
            </View>
            <View style={styles.statButton}>
              <Text style={styles.statLabel}>Group</Text>
              <Text style={styles.statValue}>{user?.groups_count || 0}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards Row */}
        <View style={styles.statsCardsContainer}>
          {/* Current Streak Card */}
          <View style={styles.statsCard}>
            <Text style={styles.streakValue}>{user?.current_streak || 0}</Text>
            <Text style={styles.fireIcon}>🔥</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>

          {/* My Group Card */}
          <TouchableOpacity 
            style={styles.groupCard}
            onPress={() => navigation.navigate('Groups')}
            activeOpacity={0.7}
          >
            <Text style={styles.groupIcon}>👥</Text>
            <Text style={styles.groupLabel}>My Group</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signOutButton, signingOut && styles.buttonDisabled]}
            onPress={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <ActivityIndicator color="#8B9D8A" size="small" />
            ) : (
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Additional spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmationModal
        visible={showSignOutModal}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
        isLoading={signingOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  // Profile Card Styles
  profileCard: {
    backgroundColor: '#8B9D8A',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  // Header Row (Avatar + Info)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  // Avatar Styles
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C5D8C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#2D3C2C',
    borderWidth: 3,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3C2C',
  },
  // User Info Section
  userInfoSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  nameLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3C2C',
    marginBottom: 6,
  },
  infoLine: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#2D3C2C',
  },
  infoValue: {
    fontWeight: '500',
    color: '#1A2419',
  },
  // Settings Icon
  settingsIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
    paddingTop: 2,
  },
  settingsText: {
    fontSize: 24,
  },
  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  statButton: {
    flex: 1,
    backgroundColor: '#C5D8C0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3C2C',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3C2C',
  },
  // Stats Cards Row
  statsCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#AEC3B0',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2D3C2C',
    marginBottom: 4,
  },
  fireIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3C2C',
    textAlign: 'center',
  },
  groupCard: {
    flex: 1,
    backgroundColor: '#AEC3B0',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3C2C',
    textAlign: 'center',
  },
  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#AEC3B0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3C2C',
  },
  signOutButton: {
    flex: 1,
    backgroundColor: '#C5D8C0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3C2C',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default ProfileScreen;
