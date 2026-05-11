import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Staricon from '../assets/icons/star.svg';
import Trashicon from '../assets/icons/trash_can.svg';
import { documentService, DocumentListItem } from '../services/documentService';

const { width } = Dimensions.get('window');

type TabType = 'recently' | 'search' | 'favourite';

interface Document {
  id: number;
  title: string;
  tags?: string[];
  isFavourite: boolean;
}

function DocumentsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = React.useState<TabType>('recently');
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load documents when component mounts
  React.useEffect(() => {
    loadDocuments();
  }, []);

  // Reload documents when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('[Documents Screen] Screen focused, reloading documents');
      loadDocuments();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[Documents Screen] Loading documents...');
      const docs = await documentService.getDocuments();
      
      // Transform API response to UI format
      const transformedDocs: Document[] = docs.map(doc => ({
        id: doc.id,
        title: doc.title,
        tags: doc.tags || [],
        isFavourite: doc.is_favorite,
      }));

      // Sort by date (newest first)
      transformedDocs.sort((a, b) => b.id - a.id);

      setDocuments(transformedDocs);
      console.log('[Documents Screen] Loaded', transformedDocs.length, 'documents');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể tải tài liệu';
      setError(errorMsg);
      console.error('[Documents Screen] Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredDocuments = (): Document[] => {
    switch (activeTab) {
      case 'favourite':
        return documents.filter(doc => doc.isFavourite);
      case 'search':
        // TODO: Implement search functionality
        return documents;
      case 'recently':
      default:
        return documents;
    }
  };

  const handleDeleteDocument = async (id: number) => {
    Alert.alert(
      'Xóa Tài Liệu',
      'Bạn có chắc muốn xóa tài liệu này?',
      [
        {
          text: 'Hủy',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Xóa',
          onPress: async () => {
            try {
              console.log('[Documents Screen] Deleting document', id);
              await documentService.deleteDocument(id);
              
              // Remove from local state
              setDocuments(docs => docs.filter(doc => doc.id !== id));
              Alert.alert('Thành công', 'Tài liệu đã được xóa');
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Lỗi xóa tài liệu';
              Alert.alert('Lỗi', errorMsg);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleToggleFavourite = async (id: number) => {
    try {
      const doc = documents.find(d => d.id === id);
      if (!doc) return;

      const newFavoriteStatus = !doc.isFavourite;
      console.log('[Documents Screen] Toggling favorite for', id);
      
      await documentService.toggleFavorite(id, newFavoriteStatus);

      // Update local state
      setDocuments(docs =>
        docs.map(d =>
          d.id === id ? { ...d, isFavourite: newFavoriteStatus } : d
        )
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi cập nhật yêu thích';
      Alert.alert('Lỗi', errorMsg);
    }
  };

  const handleOpenDocument = (documentId: number) => {
    console.log('[Documents Screen] Opening document', documentId);
    navigation.navigate('DocumentDetails', { documentId });
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>DOCUMENTS</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['recently', 'search', 'favourite'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === 'recently'
                ? 'Recently'
                : tab === 'search'
                ? 'Search'
                : 'Favourite'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Divider */}
        <View style={styles.divider} />

        {/* Loading State */}
        {isLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#6B9071" />
            <Text style={styles.loadingText}>Đang tải tài liệu...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadDocuments}
            >
              <Text style={styles.retryButtonText}>Thử Lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && !error && getFilteredDocuments().length === 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>
              {activeTab === 'favourite'
                ? '📭 Chưa có tài liệu yêu thích'
                : '📭 Chưa có tài liệu nào'}
            </Text>
          </View>
        )}

        {/* Documents List */}
        {!isLoading && !error && getFilteredDocuments().length > 0 && (
          <View style={styles.documentsContainer}>
            {getFilteredDocuments().map(doc => (
              <DocumentItem
                key={doc.id}
                document={doc}
                onPress={() => handleOpenDocument(doc.id)}
                onDelete={() => handleDeleteDocument(doc.id)}
                onToggleFavourite={() => handleToggleFavourite(doc.id)}
              />
            ))}
          </View>
        )}

        {/* Extra space for bottom nav */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

// ===== DOCUMENT ITEM COMPONENT =====
interface DocumentItemProps {
  document: Document;
  onPress: () => void;
  onDelete: () => void;
  onToggleFavourite: () => void;
}

function DocumentItem({
  document,
  onPress,
  onDelete,
  onToggleFavourite,
}: DocumentItemProps) {
  return (
    <TouchableOpacity 
      style={styles.documentItemContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.documentItem}>
        {/* Left Content */}
        <View style={styles.documentContent}>
          <Text style={styles.documentTitle}>{document.title}</Text>
          {document.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {document.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Right Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavourite();
            }}
          >
              <Staricon
                width={20}
                height={20}
              />

          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trashicon
              width={20}
              height={20}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}



// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3EED4',
  },

  // Header Styles
  headerSection: {
    backgroundColor: '#83A385',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 60,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    borderRadius: 16,
    elevation: 8,
    shadowRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#AEC3B0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButtonActive: {
    backgroundColor: '#97C09B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5341',
  },
  tabTextActive: {
    color: '#2D5341',
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
  },

  // Divider
  divider: {
    height: 6,
    marginLeft: 15,
    marginRight: 15,
    borderRadius: 3,
    backgroundColor: '#6B826B',
    marginBottom: 15,
  },

  // Documents Container
  documentsContainer: {
    paddingHorizontal: 15,
  },

  // Document Item Container (TouchableOpacity wrapper)
  documentItemContainer: {
    width: '100%',
  },

  // Document Item
  documentItem: {
    flexDirection: 'row',
    backgroundColor: '#AEC3B0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  documentContent: {
    flex: 1,
    marginRight: 10,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B3A2D',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#6B826B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  // Actions Container
  actionsContainer: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 252, 252, 0.2)',
  },
  // Bottom Space
  bottomSpace: {
    height: 20,
  },
  // Loading and Error States
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6B9071',
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default DocumentsScreen;
