import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAlertModal, AlertButton } from '../components/CustomAlertModal';
import {
  documentService,
  DocumentResponse,
  OCRData,
  SummaryData,
} from '../services/documentService';

const { width } = Dimensions.get('window');

type PendingAction = 'saveDocument' | 'createFlashcard' | null;

function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    summaryData,
    ocrData,
  }: { summaryData: SummaryData; ocrData?: OCRData } = route.params || {};

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
  const [documentTitle, setDocumentTitle] = useState('');
  const [showTitleInput, setShowTitleInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [savedDocument, setSavedDocument] = useState<DocumentResponse['data'] | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingFlashcards, setIsCreatingFlashcards] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const isBusy = isSaving || isCreatingFlashcards || isGeneratingTitle;

  const handleBack = () => {
    navigation.goBack();
  };

  const getDefaultTitle = () => {
    if (documentTitle.trim()) {
      return documentTitle.trim();
    }

    if (ocrData?.file_name) {
      return ocrData.file_name.replace(/\.[^/.]+$/, '');
    }

    return `Summary ${new Date().toLocaleDateString()}`;
  };

  const requestTitleForAction = async (action: Exclude<PendingAction, null>) => {
    setPendingAction(action);
    if (!documentTitle.trim()) {
      setShowTitleInput(true);
      setIsGeneratingTitle(true);
      try {
        const generatedTitle = await documentService.generateDocumentTitle(summaryData);
        setDocumentTitle(generatedTitle || getDefaultTitle());
      } catch (error) {
        setDocumentTitle(getDefaultTitle());
      } finally {
        setIsGeneratingTitle(false);
      }
      return;
    }
    setShowTitleInput(true);
  };

  const ensureDocumentSaved = async (title: string): Promise<DocumentResponse['data']> => {
    if (savedDocument) {
      return savedDocument;
    }

    const savedDoc = await documentService.saveDocument(
      title,
      summaryData,
      ocrData || null,
      ['Summary']
    );
    setSavedDocument(savedDoc);
    return savedDoc;
  };

  const showSavedDocumentAlert = (savedDoc: DocumentResponse['data']) => {
    setAlertConfig({
      title: 'Saved',
      message: `"${savedDoc.title}" has been saved.`,
      icon: 'OK',
      buttons: [
        {
          text: 'View Documents',
          onPress: () => {
            setAlertModalVisible(false);
            navigation.navigate('TabNavigator', { screen: 'Documents' });
          },
          style: 'default',
        },
        {
          text: 'Stay Here',
          onPress: () => setAlertModalVisible(false),
          style: 'default',
        },
      ],
    });
    setAlertModalVisible(true);
  };

  const handleSaveDocument = async () => {
    const title = documentTitle.trim();
    if (!title) {
      requestTitleForAction('saveDocument');
      return;
    }

    setIsSaving(true);
    try {
      const savedDoc = await ensureDocumentSaved(title);
      setShowTitleInput(false);
      setPendingAction(null);
      showSavedDocumentAlert(savedDoc);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cannot save document';
      setAlertConfig({
        title: 'Save Failed',
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
      setIsSaving(false);
    }
  };

  const handleCreateFlashcard = async () => {
    const title = documentTitle.trim();
    if (!title) {
      requestTitleForAction('createFlashcard');
      return;
    }

    if (!ocrData || !ocrData.ocr_results?.length) {
      setAlertConfig({
        title: 'Cannot Create Flashcards',
        message: 'OCR data is missing. Please scan or summarize this document again.',
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

    setIsCreatingFlashcards(true);
    setIsSaving(true);
    try {
      const savedDoc = await ensureDocumentSaved(title);
      setShowTitleInput(false);
      setPendingAction(null);

      const processed = await documentService.processFlashcards(ocrData);
      navigation.navigate('FlashcardDetail', {
        title: `Flashcards - ${savedDoc.title}`,
        draftFlashcardData: processed.flashcard_data,
        draftTotalCards: processed.total_cards,
        saveOptions: {
          documentId: savedDoc.id,
          sourceFileName: savedDoc.source_file_name || ocrData.file_name,
          tags: ['Flashcard'],
        },
        sourceFlow: 'summary',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cannot create flashcards';
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
      setIsSaving(false);
      setIsCreatingFlashcards(false);
    }
  };

  const handleConfirmTitle = () => {
    if (pendingAction === 'createFlashcard') {
      handleCreateFlashcard();
      return;
    }

    handleSaveDocument();
  };

  const pagesArray = summaryData?.pages
    ? Object.entries(summaryData.pages).map(([key, value]) => ({
        pageKey: key,
        content: value,
      }))
    : [];

  if (!summaryData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No summary data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>{'< BACK'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SUMMARY</Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.contentArea}
        showsVerticalScrollIndicator
      >
        <View style={styles.contentInner}>
          {pagesArray.length > 0 ? (
            <>
              {pagesArray.map((page, index) => (
                <View key={index} style={styles.pageSection}>
                  <Text style={styles.pageTitle}>{page.pageKey.toUpperCase()}</Text>
                  <Text style={styles.pageContent}>{page.content}</Text>
                </View>
              ))}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Processing time: {summaryData.processing_time}</Text>
                <Text style={styles.infoText}>Pages: {summaryData.num_pages}</Text>
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

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.backActionButton]}
          onPress={handleBack}
          disabled={isBusy}
        >
          <Text style={styles.actionButtonText}>{'< BACK'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.flashcardButton, isBusy && styles.buttonDisabled]}
          onPress={handleCreateFlashcard}
          disabled={isBusy}
        >
          {isCreatingFlashcards ? (
            <ActivityIndicator size="small" color="#344E39" />
          ) : (
            <Text style={styles.actionButtonText}>FLASHCARD {'>'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.secondaryActionsContainer}>
        <TouchableOpacity
          style={[styles.secondaryButton, isBusy && styles.buttonDisabled]}
          onPress={handleSaveDocument}
          disabled={isBusy}
        >
          {isSaving && !isCreatingFlashcards ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.secondaryButtonText}>
              {savedDocument ? 'Document Saved' : 'Save Document'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {showTitleInput && (
        <View style={styles.titleInputOverlay}>
          <View style={styles.titleInputContainer}>
            <Text style={styles.titleInputLabel}>
              {pendingAction === 'createFlashcard'
                ? 'Save this document before creating flashcards'
                : 'Save document'}
            </Text>
            {isGeneratingTitle ? (
              <View style={styles.generatingTitleBox}>
                <ActivityIndicator size="small" color="#6B9071" />
                <Text style={styles.generatingTitleText}>Generating document title...</Text>
              </View>
            ) : (
              <TextInput
                style={styles.titleInput}
                placeholder="Document title"
                placeholderTextColor="#999"
                value={documentTitle}
                onChangeText={setDocumentTitle}
                autoFocus
              />
            )}
            <View style={styles.titleInputActions}>
              <TouchableOpacity
                style={[styles.titleInputButton, styles.cancelButton]}
                onPress={() => {
                  setShowTitleInput(false);
                  setPendingAction(null);
                }}
                disabled={isSaving || isCreatingFlashcards}
              >
                <Text style={styles.titleInputButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.titleInputButton, styles.confirmButton, isBusy && styles.buttonDisabled]}
                onPress={handleConfirmTitle}
                disabled={!documentTitle.trim() || isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.titleInputButtonText}>
                    {pendingAction === 'createFlashcard' ? 'Save and Create' : 'Save'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

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
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
    width: 72,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
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
    textAlign: 'center',
  },
  secondaryActionsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    minHeight: 46,
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#6B9071',
    width: '54%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
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
    width: width * 0.84,
    maxWidth: 360,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  titleInputLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
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
  generatingTitleBox: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#AEC3B0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generatingTitleText: {
    fontSize: 13,
    color: '#344E39',
    fontWeight: '600',
  },
  titleInputActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  titleInputButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 42,
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
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
});

export default SummaryScreen;
