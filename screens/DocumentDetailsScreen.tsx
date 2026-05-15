import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { CustomAlertModal, AlertButton } from '../components/CustomAlertModal';
import { documentService, FlashcardListItem, OCRData, SummaryData } from '../services/documentService';

const { width } = Dimensions.get('window');

function DocumentDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { documentId }: { documentId: number } = route.params || {};

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [flashcardSet, setFlashcardSet] = useState<FlashcardListItem | null>(null);
  const [isFlashcardProcessing, setIsFlashcardProcessing] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    icon: string;
    buttons: AlertButton[];
  }>({
    title: '',
    message: '',
    icon: '!',
    buttons: [],
  });

  const scrollViewRef = useRef<ScrollView>(null);

  // Load document details when component mounts
  useEffect(() => {
    loadDocumentDetails();
  }, [documentId]);

  // Reload document details when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('[Document Details] Screen focused, reloading document');
      loadDocumentDetails();
      return () => {
        // Cleanup if needed
      };
    }, [documentId])
  );

  const loadDocumentDetails = async () => {
    if (!documentId) {
      setError('Invalid document ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('[Document Details] Loading document', documentId);
      const doc = await documentService.getDocumentDetail(documentId);
      
      setSummaryData(doc.summary_data);
      setOcrData(doc.ocr_data || null);
      setSourceFileName(doc.source_file_name || null);
      setDocumentTitle(doc.title);
      setIsFavorite(doc.is_favorite);
      const flashcardSets = await documentService.getFlashcardSets(documentId);
      setFlashcardSet(flashcardSets[0] || null);

      console.log('[Document Details] Loaded document:', doc.title);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Cannot load document';
      setError(errorMsg);
      console.error('[Document Details] Error loading document:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleToggleFavorite = async () => {
    try {
      console.log('[Document Details] Toggling favorite...');
      await documentService.toggleFavorite(documentId, !isFavorite);
      setIsFavorite(!isFavorite);

      const message = !isFavorite
        ? `Added "${documentTitle}" to favourites`
        : `Removed "${documentTitle}" from favourites`;

      setAlertConfig({
        title: 'Success',
        message,
        icon: 'OK',
        buttons: [
          {
            text: 'OK',
            onPress: () => setAlertModalVisible(false),
            style: 'default',
          },
        ],
      });
      setAlertModalVisible(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Cannot update favourite';
      setAlertConfig({
        title: 'Error',
        message: errorMsg,
        icon: '!',
        buttons: [
          {
            text: 'OK',
            onPress: () => setAlertModalVisible(false),
            style: 'default',
          },
        ],
      });
      setAlertModalVisible(true);
    }
  };

  const handleCreateFlashcard = async () => {
    if (flashcardSet) {
      navigation.navigate('FlashcardDetail', {
        flashcardId: flashcardSet.id,
        title: flashcardSet.title,
      });
      return;
    }

    if (!ocrData || !ocrData.ocr_results?.length) {
      setAlertConfig({
        title: 'No OCR Data',
        message: 'This document does not have OCR data for flashcard generation.',
        icon: '!',
        buttons: [
          {
            text: 'OK',
            onPress: () => setAlertModalVisible(false),
            style: 'default',
          },
        ],
      });
      setAlertModalVisible(true);
      return;
    }

    setIsFlashcardProcessing(true);
    setAlertConfig({
      title: 'Creating Flashcards',
      message: 'Creating flashcards from this document OCR data...',
      icon: '...',
      buttons: [],
    });
    setAlertModalVisible(true);

    try {
      const processed = await documentService.processFlashcards(ocrData);

      setAlertModalVisible(false);
      navigation.navigate('FlashcardDetail', {
        title: `Flashcards - ${documentTitle}`,
        draftFlashcardData: processed.flashcard_data,
        draftTotalCards: processed.total_cards,
        saveOptions: {
          documentId,
          sourceFileName,
          tags: ['Flashcard'],
        },
        sourceFlow: 'documentDetails',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cannot create flashcards';
      setAlertConfig({
        title: 'Error',
        message,
        icon: '!',
        buttons: [
          {
            text: 'OK',
            onPress: () => setAlertModalVisible(false),
            style: 'default',
          },
        ],
      });
      setAlertModalVisible(true);
    } finally {
      setIsFlashcardProcessing(false);
    }
  };

  const handleDeleteDocument = () => {
    setAlertConfig({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${documentTitle}"?`,
      icon: '!',
      buttons: [
        {
          text: 'Cancel',
          onPress: () => setAlertModalVisible(false),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            setAlertModalVisible(false);
            try {
              console.log('[Document Details] Deleting document', documentId);
              await documentService.deleteDocument(documentId);

              setAlertConfig({
                title: 'Deleted',
                message: `"${documentTitle}" has been removed from your library.`,
                icon: 'OK',
                buttons: [
                  {
                    text: 'OK',
                    onPress: () => {
                      setAlertModalVisible(false);
                      navigation.navigate('Documents');
                    },
                    style: 'default',
                  },
                ],
              });
              setAlertModalVisible(true);
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Cannot delete document';
              setAlertConfig({
                title: 'Error',
                message: errorMsg,
                icon: '!',
                buttons: [
                  {
                    text: 'OK',
                    onPress: () => setAlertModalVisible(false),
                    style: 'default',
                  },
                ],
              });
              setAlertModalVisible(true);
            }
          },
          style: 'destructive',
        },
      ],
    });
    setAlertModalVisible(true);
  };

  // Extract pages array from summary data
  const pagesArray = summaryData && summaryData.pages
    ? Object.entries(summaryData.pages).map(([key, value]) => ({
        pageKey: key,
        content: value,
      }))
    : [];

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B9071" />
          <Text style={styles.loadingText}>Loading document...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadDocumentDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!summaryData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No document data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>{'< BACK'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{documentTitle.toUpperCase()}</Text>
        <TouchableOpacity onPress={handleToggleFavorite}>
          <Text style={styles.favoriteButton}>{isFavorite ? '*' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
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
                    {page.pageKey.toUpperCase()}
                  </Text>
                  <Text style={styles.pageContent}>
                    {page.content}
                  </Text>
                </View>
              ))}

              {/* Processing Time Info */}
              <View style={styles.infoBox}>
                {sourceFileName ? (
                  <Text style={styles.infoText}>
                    File: {sourceFileName}
                  </Text>
                ) : null}
                <Text style={styles.infoText}>
                  Processing time: {summaryData.processing_time}
                </Text>
                <Text style={styles.infoText}>
                  Pages: {summaryData.num_pages}
                </Text>
                {ocrData ? (
                  <Text style={styles.infoText}>
                    OCR blocks: {ocrData.num_blocks ?? ocrData.ocr_results?.length ?? 0}
                  </Text>
                ) : null}
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No summary content</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bookmark Section */}
      <View style={styles.bookmarkSection}>
        <Text style={styles.bookmarkIcon}>-</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.backActionButton]}
          onPress={handleBack}
        >
          <Text style={styles.actionButtonText}>{'< BACK'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.flashcardButton]}
          onPress={handleCreateFlashcard}
          disabled={isFlashcardProcessing}
        >
          <Text style={styles.actionButtonText}>
            {isFlashcardProcessing
              ? 'CREATING...'
              : flashcardSet
              ? 'VIEW FLASHCARD >'
              : 'CREATE FLASHCARD >'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Actions */}
      <View style={styles.secondaryActionsContainer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleDeleteDocument}
        >
          <Text style={styles.secondaryButtonText}>Delete Document</Text>
        </TouchableOpacity>
      </View>

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

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3EED4',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },

  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#6B9071',
    borderRadius: 8,
  },

  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Header Styles
  header: {
    backgroundColor: '#83A385',
    paddingHorizontal: 20,
    paddingVertical: 12,
    margin: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  backButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    paddingHorizontal: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },

  favoriteButton: {
    fontSize: 20,
    paddingHorizontal: 10,
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
  },

  pageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },

  pageContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },

  infoBox: {
    backgroundColor: '#F5EEDB',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#6B9071',
  },

  infoText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },

  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
  },

  bookmarkSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },

  bookmarkIcon: {
    fontSize: 24,
  },

  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  backActionButton: {
    backgroundColor: '#AEC3B0',
  },

  flashcardButton: {
    backgroundColor: '#6B9071',
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },

  secondaryActionsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    margin: 10,
    borderRadius: 10,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },

  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default DocumentDetailsScreen;
