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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar Circle */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          {/* User Info Section */}
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfo}>
              <Text style={styles.nameLabel}>
                {user?.username || 'User'}
              </Text>
              <Text style={styles.emailLabel}>
                Email: <Text style={styles.emailValue}>{user?.email}</Text>
              </Text>
              <Text style={styles.roleLabel}>
                Role: <Text style={styles.roleValue}>Student</Text>
              </Text>
              <Text style={styles.fieldLabel}>
                Field (optional): <Text style={styles.fieldValue}>-</Text>
              </Text>
            </View>
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
        </View>

        {/* Empty Content Cards for Future Features */}
        <View style={styles.contentCardsContainer}>
          <View style={styles.contentCard} />
          <View style={styles.contentCard} />
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
  // Avatar Styles
  avatarContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C5D8C0',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#8B9D8A',
    borderWidth: 3,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5A6B56',
  },
  // User Info Styles
  userInfoContainer: {
    marginBottom: 24,
    marginLeft: 0,
  },
  userInfo: {
    gap: 8,
  },
  nameLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3C2C',
    marginBottom: 8,
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3C2C',
  },
  emailValue: {
    fontWeight: '500',
    color: '#1A2419',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3C2C',
  },
  roleValue: {
    fontWeight: '500',
    color: '#1A2419',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3C2C',
  },
  fieldValue: {
    fontWeight: '500',
    color: '#1A2419',
  },
  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
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
  // Content Cards Styles
  contentCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  contentCard: {
    flex: 1,
    height: 150,
    backgroundColor: '#AEC3B0',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default ProfileScreen;
