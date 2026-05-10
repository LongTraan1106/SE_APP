/**
 * Group Screen
 * Main screen để xem groups và tạo/tìm kiếm groups
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useGroup } from '../contexts/GroupContext';
import { Group } from '../types/group';
import { formatMemberCount } from '../utils/groupPermissionHelpers';
import { CreateGroupModal } from '../components/CreateGroupModal';
import { GroupDetailModal } from '../components/GroupDetailModal';

function GroupScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { groups, loading, error, getGroups, clearError } = useGroup();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isTeacher = user?.role === 'teacher';

  useFocusEffect(
    React.useCallback(() => {
      getGroups();
    }, [getGroups])
  );

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleGroupPress = (group: Group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
  };

  const handleCreateGroup = () => {
    if (!isTeacher) {
      Alert.alert('Permission Denied', 'Only teachers can create groups');
      return;
    }
    setShowCreateModal(true);
  };

  const handleSearchGroups = () => {
    navigation.navigate('SearchGroups');
  };

  const renderGroupCard = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleGroupPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupContent}>
        <Text style={styles.groupName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.memberCount}>
          {formatMemberCount(item.member_count)}
        </Text>
        {item.description && (
          <Text style={styles.description} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      <View style={styles.arrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No groups yet</Text>
      <Text style={styles.emptySubText}>
        {isTeacher
          ? 'Create a new group or search for public groups'
          : 'Search for public groups to join'}
      </Text>
    </View>
  );

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Groups</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.createButton,
              !isTeacher ? styles.buttonDisabled : null,
            ]}
            onPress={handleCreateGroup}
            disabled={!isTeacher}
          >
            <Text style={styles.buttonText}>+ Create Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.searchButton]}
            onPress={handleSearchGroups}
          >
            <Text style={styles.buttonText}>Search Groups</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Groups List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B9D8A" />
          </View>
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={() => {
          getGroups();
          setShowCreateModal(false);
        }}
      />

      {/* Group Detail Modal */}
      <GroupDetailModal
        visible={showDetailModal}
        group={selectedGroup}
        onClose={() => setShowDetailModal(false)}
        onDataUpdated={() => {
          getGroups();
          setShowDetailModal(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8B9D8A',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 34,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButton: {
    backgroundColor: '#8B9D8A',
  },
  searchButton: {
    backgroundColor: '#AEC3B0',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: '#D0DCC8',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#AEC3B0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupContent: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3C2C',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5A6B56',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#5A6B56',
    fontStyle: 'italic',
  },
  arrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3C2C',
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3C2C',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A6B56',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default GroupScreen;
