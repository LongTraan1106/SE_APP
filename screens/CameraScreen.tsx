import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import DocumentScanner from '@dariyd/react-native-document-scanner';
import * as DocumentPicker from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import Ideas_icon from '../assets/icons/ideas.svg';
import Surface_icon from '../assets/icons/surface.svg';
import Camera_icon from '../assets/icons/camera.svg';

function CameraScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [scannedImages, setScannedImages] = useState<string[] | null>(null);

  // Request camera permission on mount
  useEffect(() => {
    requestCameraPermission();
  }, []);

  // Navigate when scannedImages is ready
  useEffect(() => {
    if (scannedImages && scannedImages.length > 0) {
      const timer = setTimeout(() => {
        try {
          navigation.navigate('DocumentScanResult', {
            scannedImages: scannedImages,
          });
        } catch (error) {
          console.error('Navigation error:', error);
        }
        setScannedImages(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scannedImages, navigation]);

  // ── Camera permission ──────────────────────────────────────────────────────

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const permission =
        Platform.OS === 'android'
          ? PERMISSIONS.ANDROID.CAMERA
          : PERMISSIONS.IOS.CAMERA;

      const result = await request(permission);

      if (result === RESULTS.GRANTED) {
        setCameraPermission(true);
        return true;
      } else if (result === RESULTS.DENIED) {
        setCameraPermission(false);
        Alert.alert(
          'Quyền Camera Bị Từ Chối',
          'Ứng dụng cần quyền truy cập camera để hoạt động. Vui lòng cho phép quyền camera.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Thử Lại', onPress: () => requestCameraPermission() },
          ]
        );
        return false;
      } else if (result === RESULTS.BLOCKED) {
        setCameraPermission(false);
        Alert.alert(
          'Quyền Camera Bị Khóa',
          'Quyền camera đã bị từ chối trước đó. Vui lòng bật trong Cài đặt ứng dụng.',
          [{ text: 'OK', style: 'cancel' }]
        );
        return false;
      }

      setCameraPermission(false);
      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setCameraPermission(false);
      return false;
    }
  };

  // ── Scan document ──────────────────────────────────────────────────────────

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);

      DocumentScanner.launchScanner({}, async (result: any) => {
        setIsLoading(false);

        const scannedUris = result?.images || result;

        if (Array.isArray(scannedUris) && scannedUris.length > 0) {
          // Extract string URIs
          const imageUris = scannedUris.map((img: any) => {
            if (typeof img === 'string') return img;
            if (img?.uri) return img.uri;
            if (img?.path) return 'file://' + img.path;
            return img;
          });

          try {
            setIsLoading(true);
            const savedUris = await saveImagesToDocuments(imageUris);
            setScannedImages(savedUris);
          } catch (error) {
            console.error('Error processing images:', error);
            Alert.alert('Cảnh báo', 'Có lỗi khi xử lý ảnh. Vui lòng thử lại.');
          } finally {
            setIsLoading(false);
          }
        } else {
          Alert.alert('Thông báo', 'Không có tài liệu được quét hoặc đã cancel.');
        }
      });
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error scanning document:', error);
      Alert.alert('Lỗi', 'Không thể quét tài liệu: ' + error.message);
    }
  };

  // ── Copy file from content URI to app cache ────────────────────────────────

  const copyFileToCache = async (sourceUri: string, fileName: string): Promise<string> => {
    try {
      const cacheDir = RNFS.CachesDirectoryPath;
      const safeFileName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const destPath = `${cacheDir}/${Date.now()}_${safeFileName}`;

      console.log('Copying file:', { sourceUri, destPath });

      // Use RNFS.copyFile which works with content:// URIs on Android
      await RNFS.copyFile(sourceUri, destPath);

      const fileUri = `file://${destPath}`;
      console.log('File copied successfully:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('Error copying file to cache:', error);
      throw error;
    }
  };

  // ── Upload PDF from device ─────────────────────────────────────────────────

  const handleUploadPDF = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
      });

      if (result && result.length > 0) {
        const pdfFile = result[0];
        const pdfUri = pdfFile.uri;
        const pdfName = pdfFile.name || 'document.pdf';
        const pdfSize = pdfFile.size || 0;

        console.log('PDF picked from picker:', { uri: pdfUri, name: pdfName, size: pdfSize });

        try {
          // Copy file from content:// to cache
          const cachedUri = await copyFileToCache(pdfUri, pdfName);

          setIsLoading(false);

          // Navigate with cached file:// URI
          navigation.navigate('DocumentScanResult', {
            pdfData: {
              uri: cachedUri,
              name: pdfName,
              size: pdfSize,
            },
          });
        } catch (copyError) {
          console.error('Error copying file:', copyError);
          Alert.alert('Lỗi', 'Không thể xử lý file PDF. Vui lòng thử lại.');
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Error picking PDF:', error);
      if (error.code !== 'DOCUMENT_PICKER_CANCELLED') {
        Alert.alert('Lỗi', 'Không thể chọn file PDF. Vui lòng thử lại.');
      }
      setIsLoading(false);
    }
  };

  // ── Save images to app's persistent Documents directory ───────────────────
  // No storage permission needed — DocumentDirectoryPath is app-private storage.

  const saveImagesToDocuments = async (imageUris: string[]): Promise<string[]> => {
    const documentsDir = RNFS.DocumentDirectoryPath + '/scanned_documents';

    // Ensure directory exists
    const dirExists = await RNFS.exists(documentsDir);
    if (!dirExists) {
      await RNFS.mkdir(documentsDir);
    }

    const savedUris: string[] = [];

    for (const uri of imageUris) {
      // Clean up source path (strip file:// for RNFS)
      const sourcePath = uri.startsWith('file://') ? uri.slice(7) : uri;

      // Generate unique destination filename
      const filename = `scan_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const destPath = `${documentsDir}/${filename}`;

      await RNFS.copyFile(sourcePath, destPath);

      // Return file:// URI for use with <Image>
      savedUris.push('file://' + destPath);
    }

    return savedUris;
  };

  // ── Render ─────────────────────────────────────────────────────────────────



  if (cameraPermission === false) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Camera Permission Denied</Text>
          <Text style={styles.errorSubText}>
            Please enable camera permission in the app settings
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={requestCameraPermission}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.backCameraButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cameraPermission === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Checking permissions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Go Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Documents</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Guide */}
      
      <View style={styles.scannerGuideContainer}>
        <View style={styles.figContainer}>
          <Image
            source={require('../assets/scan_fig.png')}
            style={styles.figImage}
          />
        </View>
        <Text style={styles.guideTitleText}>Scan your Documents</Text>
        <Text style={styles.guideDescriptionText}>
          Press the button below to start scanning your documents. The system will automatically detect
          the edges of the document and crop it precisely.
        </Text>

        <View style={styles.guideItemsContainer}>
          <View style={styles.guideItem}>
            <Surface_icon width={24} height={24}/>
            <Text style={styles.guideItemText}>Place the document on a flat surface</Text>
          </View>
          <View style={styles.guideItem}>
            <Camera_icon width={24} height={24} />
            <Text style={styles.guideItemText}>Ensure adequate lighting</Text>
          </View>
          <View style={styles.guideItem}>
            <Ideas_icon width={24} height={24} />
            <Text style={styles.guideItemText}>Take a straight-on photo</Text>
          </View>
        </View>
      </View>

      {/* Scan Button */}
      <View style={styles.captureButtonContainer}>
        <TouchableOpacity
          style={[styles.scanButton, isLoading && styles.scanButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={isLoading}
        >
          <Text style={styles.scanButtonText}>
            {isLoading ? '⏳ Processing...' : 'Scan Documents'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadPdfButton, isLoading && styles.scanButtonDisabled]}
          onPress={handleUploadPDF}
          disabled={isLoading}
        >
          <Text style={styles.uploadPdfButtonText}>
            {isLoading ? '⏳ Processing...' : 'Upload PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EFDD',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#6B826B',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  figContainer: {
    alignItems: 'center',
  },
  figImage: {
    width: 200,
    height: 150,
    resizeMode: 'contain',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#6B9071',
  },
  backCameraButton: {
    backgroundColor: '#888',
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
  errorSubText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scannerGuideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  guideTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#323C1A',
    marginBottom: 15,
    textAlign: 'center',
  },
  guideDescriptionText: {
    fontSize: 14,
    color: '#323C1A',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  guideItemsContainer: {
    width: '100%',
    marginBottom: 15,
  },
  guideItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 5,
    backgroundColor: '#E6F7EF',
    borderWidth: 1,
    borderColor: '#6B9071',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guideItemText: {
    fontSize: 13,
    color: '#2D5341',
    fontWeight: '500',
  },
  captureButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F6EFDD',
    gap: 12,
  },
  scanButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#6B9071',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '80%',
  },
  uploadPdfButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '80%',
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadPdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CameraScreen;
