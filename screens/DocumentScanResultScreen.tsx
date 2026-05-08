import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import DocumentScanner from '@dariyd/react-native-document-scanner';
import RNFS from 'react-native-fs';
import Flashcard_icon from '../assets/icons/flashcard.svg';
import Summarize_icon from '../assets/icons/doc.svg';
import Save_icon from '../assets/icons/save.svg';
import { CustomAlertModal, AlertButton } from '../components/CustomAlertModal';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GALLERY_HEIGHT = SCREEN_HEIGHT * 0.48;

function DocumentScanResultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { scannedImages: initialImages = [] } = route.params || {};
  const [images, setImages] = useState<string[]>(initialImages);
  const [currentPage, setCurrentPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<{[key: number]: string}>({});
  const [imageLoadingStates, setImageLoadingStates] = useState<{[key: number]: boolean}>({});
  const flatListRef = useRef<FlatList>(null);

  // Custom Alert Modal State
  const [alertModalVisible, setAlertModalVisible] = useState(false);
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

  // Handle scroll to update current page indicator
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(contentOffsetX / width);
    setCurrentPage(page);
  };

  // ============ Mock Functions ============

  const handleSummarize = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      setAlertConfig({
        title: '✅ Tóm Tắt',
        message: 'Đang xử lý tóm tắt tài liệu...\n\n(Tính năng này sẽ gọi backend để xử lý)',
        icon: '📋',
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
      setAlertConfig({
        title: 'Lỗi',
        message: 'Không thể tóm tắt tài liệu',
        icon: '❌',
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
      setIsProcessing(false);
    }
  };

  const handleCreateFlashcard = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      setAlertConfig({
        title: '✅ Tạo Flashcard',
        message: 'Đang tạo flashcard từ tài liệu...\n\n(Tính năng này sẽ gọi backend để xử lý)',
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
    } catch (error) {
      setAlertConfig({
        title: 'Lỗi',
        message: 'Không thể tạo flashcard',
        icon: '❌',
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
      setIsProcessing(false);
    }
  };

  const handleSaveDocument = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      setAlertConfig({
        title: '✅ Lưu Thành Công',
        message: `Tài liệu ${images.length} trang đã được lưu trữ!\n\n(Sẽ được thêm vào Documents)`,
        icon: '💾',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              setAlertModalVisible(false);
              // Pop tất cả modal screens về TabNavigator, rồi navigate tới Documents tab
              navigation.popToTop();
              navigation.navigate('TabNavigator', { screen: 'Documents' });
            },
            style: 'default',
          },
        ],
      });
      setAlertModalVisible(true);
    } catch (error) {
      setAlertConfig({
        title: 'Lỗi',
        message: 'Không thể lưu tài liệu',
        icon: '❌',
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
      setIsProcessing(false);
    }
  };

  // ── Save new pages to DocumentDirectoryPath ───────────────────────────────
  const saveImagesToDocuments = async (imageUris: string[]): Promise<string[]> => {
    const documentsDir = RNFS.DocumentDirectoryPath + '/scanned_documents';
    const dirExists = await RNFS.exists(documentsDir);
    if (!dirExists) {
      await RNFS.mkdir(documentsDir);
    }
    const savedUris: string[] = [];
    for (const uri of imageUris) {
      const sourcePath = uri.startsWith('file://') ? uri.slice(7) : uri;
      const filename = `scan_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const destPath = `${documentsDir}/${filename}`;
      await RNFS.copyFile(sourcePath, destPath);
      savedUris.push('file://' + destPath);
    }
    return savedUris;
  };

  // ── Scan thêm trang và append vào danh sách hiện tại ─────────────────────
  const handleRescan = () => {
    if (isScanning || isProcessing) return;
    setIsScanning(true);

    DocumentScanner.launchScanner({}, async (result: any) => {
      try {
        const scannedUris = result?.images || result;

        if (!Array.isArray(scannedUris) || scannedUris.length === 0) {
          // User cancelled — no alert needed
          return;
        }

        // Extract string URIs
        const imageUris = scannedUris.map((img: any) => {
          if (typeof img === 'string') return img;
          if (img?.uri) return img.uri;
          if (img?.path) return 'file://' + img.path;
          return img;
        });

        // Save and append
        const savedUris = await saveImagesToDocuments(imageUris);
        setImages(prev => {
          const updated = [...prev, ...savedUris];
          // Scroll to first new page after state update
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: prev.length,
              animated: true,
            });
          }, 150);
          return updated;
        });
      } catch (error) {
        console.error('Error appending scanned pages:', error);
        setAlertConfig({
          title: 'Lỗi',
          message: 'Không thể lưu trang mới. Vui lòng thử lại.',
          icon: '❌',
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
        setIsScanning(false);
      }
    });
  };

  const handleCancel = () => {
    setAlertConfig({
      title: 'Hủy Quét',
      message: 'Bạn chắc chắn muốn hủy các trang đã quét?',
      icon: '⚠️',
      buttons: [
        {
          text: 'Không',
          onPress: () => setAlertModalVisible(false),
          style: 'cancel',
        },
        {
          text: 'Có',
          onPress: () => {
            setAlertModalVisible(false);
            navigation.popToTop();
          },
          style: 'destructive',
        },
      ],
    });
    setAlertModalVisible(true);
  };

  // Render document page in gallery
  const renderDocumentPage = ({ item, index }: { item: string; index: number }) => {
    const hasError = imageLoadErrors[index];
    const isLoading = imageLoadingStates[index];

    return (
      <View style={styles.pageContainer}>
        <View style={styles.pageWrapper}>

          {hasError ? (
            <View style={styles.errorContent}>
              <Text style={styles.errorMessage}>❌ Không thể tải ảnh</Text>
              <Text style={styles.errorDetail}>{hasError}</Text>
            </View>
          ) : (
            <>
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#6B9071" />
                </View>
              )}
              <Image
                source={{ uri: item }}
                style={styles.documentImage}
                resizeMode="contain"
                onLoadStart={() => {
                  console.log(`🖼️ Image ${index} - Loading started`);
                  setImageLoadingStates(prev => ({ ...prev, [index]: true }));
                }}
                onLoadEnd={() => {
                  console.log(`🖼️ Image ${index} - Loading ended`);
                  setImageLoadingStates(prev => ({ ...prev, [index]: false }));
                }}
                onError={(error) => {
                  console.error(`❌ Image ${index} - Error:`, error.nativeEvent.error);
                  setImageLoadErrors(prev => ({
                    ...prev,
                    [index]: error.nativeEvent.error || 'Unknown error',
                  }));
                }}
              />
            </>
          )}

          <View style={styles.pageNumber}>
            <Text style={styles.pageNumberText}>Page {index + 1}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!images || images.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ No documents scanned</Text>
          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Document Gallery */}
      <View style={styles.gallerySection}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderDocumentPage}
          keyExtractor={(_, index) => `page-${index}`}
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={handleScroll}
          showsHorizontalScrollIndicator={false}
        />

        {/* Page Indicator */}
        <View style={styles.pageIndicatorContainer}>
          <Text style={styles.pageIndicatorText}>
            {currentPage + 1} / {images.length}
          </Text>
        </View>

        {/* Dots Indicator */}
        <View style={styles.dotsContainer}>
          {images.map((_: string, index: number) => (
            <View
              key={`dot-${index}`}
              style={[
                styles.dot,
                currentPage === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          Scaned {images.length} pages successfully!
        </Text>
        <Text style={styles.infoSubText}>
          You can summarize, create flashcards, or save this document
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.summarizeButton, isProcessing && styles.buttonDisabled]}
          onPress={handleSummarize}
          disabled={isProcessing}
        >
          <Summarize_icon width={24} height={24} style={{ marginBottom: 4 }} />
          <Text style={styles.actionButtonText}>Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.flashcardButton, isProcessing && styles.buttonDisabled]}
          onPress={handleCreateFlashcard}
          disabled={isProcessing}
        >
          <Flashcard_icon width={24} height={24} style={{ marginBottom: 4 }} />
          <Text style={styles.actionButtonText}>Flashcard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, isProcessing && styles.buttonDisabled]}
          onPress={handleSaveDocument}
          disabled={isProcessing}
        >
          <Save_icon width={24} height={24} style={{ marginBottom: 4 }} />
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Secondary Action */}
      <View style={styles.secondaryActionsContainer}>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            styles.rescanButton,
            (isScanning || isProcessing) && styles.buttonDisabled,
          ]}
          onPress={handleRescan}
          disabled={isScanning || isProcessing}
        >
          <Text style={styles.secondaryButtonText}>
            {isScanning ? 'Scaning...' : 'Scan more pages'}
          </Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cancelButton: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    paddingHorizontal: 10,
  },
  gallerySection: {
    height: GALLERY_HEIGHT + 50, // image area + page indicator
    marginVertical: 10,
  },
  pageContainer: {
    width: width,          // full width — FlatList pages by its own width
    paddingHorizontal: 20,
    height: GALLERY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageWrapper: {
    width: '100%',
    height: GALLERY_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(107, 144, 113, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pageNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 5,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c33',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 10,
    color: '#666',
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  pageIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  pageIndicatorText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#6B9071',
    width: 24,
  },
  inactiveDot: {
    backgroundColor: '#C5D8C0',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D5341',
    marginBottom: 5,
  },
  infoSubText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
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
    paddingHorizontal: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  summarizeButton: {
    backgroundColor: '#AEC3B0',
  },
  flashcardButton: {
    backgroundColor: '#AEC3B0',
  },
  saveButton: {
    backgroundColor: '#AEC3B0',
  },
  actionButtonText: {
    color: '#344E39',
    fontSize: 12,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryActionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    paddingVertical: 11,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  rescanButton: {
    borderColor: '#6B9071',
    backgroundColor: '#6B9071',
    width: '50%',
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#6B9071',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    fontWeight: '600',
  },
});

export default DocumentScanResultScreen;
