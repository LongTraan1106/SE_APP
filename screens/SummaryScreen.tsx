import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CustomAlertModal, AlertButton } from '../components/CustomAlertModal';
import { documentService } from '../services/documentService';

const { width } = Dimensions.get('window');

interface SummaryData {
  pages: { [key: string]: string };
  full_summary: string;
  processing_time: string;
  num_pages: number;
}

function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { summaryData }: { summaryData: SummaryData } = route.params || {};

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    icon: string;
    buttons: AlertButton[];
  }>({
    title: '',
    message: '',
    icon: '⚠️',
    buttons: [],
  });

  const scrollViewRef = useRef<ScrollView>(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCreateFlashcard = () => {
    setAlertConfig({
      title: '✅ Tạo Flashcard',
      message: 'Tính năng này sẽ sớm được cập nhật!\n\nBạn có thể sử dụng nội dung tóm tắt trên để tạo flashcard thủ công.',
      icon: '🎴',
      buttons: [
        {
          text: 'OK',
          onPress: () => setAlertModalVisible(false),
          style: 'default',
        },
      ],
    });
    setAlertModalVisible(true);
  };

  const handleSaveDocument = async () => {
    // Nếu chưa nhập title, hiển thị input modal
    if (!documentTitle.trim()) {
      setShowTitleInput(true);
      return;
    }

    setIsSaving(true);
    try {
      console.log('[Summary Flow] Saving document with title:', documentTitle);
      
      // Gọi API để lưu document
      const savedDoc = await documentService.saveDocument(
        documentTitle,
        summaryData,
        ['Summary'] // Default tag
      );

      console.log('[Summary Flow] Document saved successfully:', savedDoc.id);

      // Reset states trước khi show alert
      setShowTitleInput(false);
      setDocumentTitle('');

      setAlertConfig({
        title: '✅ Lưu Thành Công',
        message: `Tài liệu "${savedDoc.title}" đã được lưu!`,
        icon: '💾',
        buttons: [
          {
            text: 'Xem Tài Liệu',
            onPress: () => {
              setAlertModalVisible(false);
              // Navigate to Documents tab screen
              navigation.navigate('TabNavigator', { screen: 'Documents' });
            },
            style: 'default',
          },
          {
            text: 'Quay Lại',
            onPress: () => {
              setAlertModalVisible(false);
              // Stay on SummaryScreen - just close alert
            },
            style: 'default',
          },
        ],
      });
      setAlertModalVisible(true);
    } catch (error) {
      console.error('[Summary Flow] Error saving document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      
      setAlertConfig({
        title: '❌ Lỗi Lưu',
        message: `Không thể lưu tài liệu: ${errorMessage}`,
        icon: '❌',
        buttons: [
          {
            text: 'Thử Lại',
            onPress: () => {
              setAlertModalVisible(false);
              handleSaveDocument();
            },
            style: 'default',
          },
          {
            text: 'Hủy',
            onPress: () => setAlertModalVisible(false),
            style: 'cancel',
          },
        ],
      });
      setAlertModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Tách pages thành array
  const pagesArray = summaryData && summaryData.pages
    ? Object.entries(summaryData.pages).map(([key, value]) => ({
        pageKey: key,
        content: value,
      }))
    : [];

  if (!summaryData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Không có dữ liệu tóm tắt</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SUMMARY</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Content Area - Summary List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.contentArea}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.contentInner}>
          {pagesArray.length > 0 ? (
            <>
              {pagesArray.map((page, index) => (
                <View key={index} style={styles.pageSection}>
                  <Text style={styles.pageTitle}>
                    📄 {page.pageKey.toUpperCase()}
                  </Text>
                  <Text style={styles.pageContent}>
                    {page.content}
                  </Text>
                </View>
              ))}

              {/* Processing Time Info */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ⏱️ Thời gian xử lý: {summaryData.processing_time}
                </Text>
                <Text style={styles.infoText}>
                  📊 Số trang: {summaryData.num_pages}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có nội dung tóm tắt</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bookmark Section */}
      <View style={styles.bookmarkSection}>
        <Text style={styles.bookmarkIcon}>🔖</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.backActionButton]}
          onPress={handleBack}
        >
          <Text style={styles.actionButtonText}>‹ BACK</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.flashcardButton]}
          onPress={handleCreateFlashcard}
        >
          <Text style={styles.actionButtonText}>FLASHCARD ›</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Action */}
      <View style={styles.secondaryActionsContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSaveDocument}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.secondaryButtonText}>💾 Save Document</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Title Input Modal */}
      {showTitleInput && (
        <View style={styles.titleInputOverlay}>
          <View style={styles.titleInputContainer}>
            <Text style={styles.titleInputLabel}>Tên tài liệu:</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Nhập tên tài liệu..."
              placeholderTextColor="#999"
              value={documentTitle}
              onChangeText={setDocumentTitle}
              autoFocus
            />
            <View style={styles.titleInputActions}>
              <TouchableOpacity
                style={[styles.titleInputButton, styles.cancelButton]}
                onPress={() => {
                  setShowTitleInput(false);
                  setDocumentTitle('');
                }}
              >
                <Text style={styles.titleInputButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleInputButton, styles.confirmButton]}
                onPress={handleSaveDocument}
                disabled={!documentTitle.trim() || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.titleInputButtonText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Custom Alert Modal */}
      <CustomAlertModal
        visible={alertModalVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EEDB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    margin: 10,
    borderRadius: 10,
    backgroundColor: '#6B9071',
  },
  backButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  contentArea: {
    flex: 1,
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentInner: {
    paddingBottom: 10,
  },
  pageSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D5341',
    marginBottom: 10,
  },
  pageContent: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  infoBox: {
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6B9071',
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    marginVertical: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  bookmarkSection: {
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  bookmarkIcon: {
    fontSize: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  backActionButton: {
    backgroundColor: '#AEC3B0',
  },
  flashcardButton: {
    backgroundColor: '#AEC3B0',
  },
  actionButtonText: {
    color: '#344E39',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#6B9071',
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  // Title Input Modal Styles
  titleInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  titleInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 350,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  titleInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#AEC3B0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  titleInputActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  titleInputButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#AEC3B0',
  },
  confirmButton: {
    backgroundColor: '#6B9071',
  },
  titleInputButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SummaryScreen;
