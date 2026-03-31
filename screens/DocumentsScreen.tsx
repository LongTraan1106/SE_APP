import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Staricon from '../assets/icons/star.svg';
import Trashicon from '../assets/icons/trash_can.svg';

const { width } = Dimensions.get('window');

type TabType = 'recently' | 'search' | 'favourite';

interface Document {
  id: string;
  title: string;
  tags: string[];
  isFavourite: boolean;
}

function DocumentsScreen() {
  const [activeTab, setActiveTab] = React.useState<TabType>('recently');

  // Mock data - học viên có thể thay đổi dữ liệu theo nhu cầu
  const documentData: Document[] = [
    {
      id: '1',
      title: 'Machine learning',
      tags: ['Summary'],
      isFavourite: false,
    },
    {
      id: '2',
      title: 'Basic ReactJS',
      tags: ['Summary', 'Flashcard'],
      isFavourite: false,
    },
    {
      id: '3',
      title: 'JavaScript Advanced',
      tags: [],
      isFavourite: false,
    },
    {
      id: '4',
      title: 'Web Development',
      tags: ['Flashcard'],
      isFavourite: false,
    },
    {
      id: '5',
      title: 'Python Basics',
      tags: ['Summary'],
      isFavourite: false,
    },
  ];

  const handleDeleteDocument = (id: string) => {
    console.log('Delete document:', id);
    // TODO: Thêm logic xóa document
  };

  const handleToggleFavourite = (id: string) => {
    console.log('Toggle favourite:', id);
    // TODO: Thêm logic toggle yêu thích
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

        {/* Documents List */}
        <View style={styles.documentsContainer}>
          {documentData.map(doc => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onDelete={() => handleDeleteDocument(doc.id)}
              onToggleFavourite={() => handleToggleFavourite(doc.id)}
            />
          ))}
        </View>

        {/* Extra space for bottom nav */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

// ===== DOCUMENT ITEM COMPONENT =====
interface DocumentItemProps {
  document: Document;
  onDelete: () => void;
  onToggleFavourite: () => void;
}

function DocumentItem({
  document,
  onDelete,
  onToggleFavourite,
}: DocumentItemProps) {
  return (
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
          onPress={onToggleFavourite}
        >
            <Staricon
              width={20}
              height={20}
            />

        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Trashicon
            width={20}
            height={20}
          />
        </TouchableOpacity>
      </View>
    </View>
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
});

export default DocumentsScreen;
