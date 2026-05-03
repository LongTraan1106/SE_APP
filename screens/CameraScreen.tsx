import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import DocumentScanner from '@dariyd/react-native-document-scanner';
import RNFS from 'react-native-fs';

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
          <Text style={styles.errorText}>❌ Quyền Camera Bị Từ Chối</Text>
          <Text style={styles.errorSubText}>
            Vui lòng bật quyền camera trong cài đặt ứng dụng
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={requestCameraPermission}
          >
            <Text style={styles.buttonText}>Thử Lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.backCameraButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Quay Lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (cameraPermission === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Đang kiểm tra quyền...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quét Tài Liệu</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Guide */}
      <View style={styles.scannerGuideContainer}>
        <Text style={styles.guideTitleText}>📄 Quét Tài Liệu của Bạn</Text>
        <Text style={styles.guideDescriptionText}>
          Bấm nút dưới để bắt đầu quét tài liệu. Hệ thống sẽ tự động phát hiện
          các cạnh của tài liệu và cắt chính xác.
        </Text>

        <View style={styles.guideItemsContainer}>
          <View style={styles.guideItem}>
            <Text style={styles.guideItemText}>✅ Đặt tài liệu trên bề mặt phẳng</Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideItemText}>✅ Đảm bảo ánh sáng đầy đủ</Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideItemText}>✅ Chụp hình vuông góc</Text>
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
            {isLoading ? '⏳ Đang xử lý...' : '📷 Quét Tài Liệu'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3EED4',
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
    backgroundColor: '#6B9071',
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
  },
  guideTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6B9071',
    marginBottom: 15,
    textAlign: 'center',
  },
  guideDescriptionText: {
    fontSize: 14,
    color: '#555',
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
    backgroundColor: '#E3EED4',
    borderLeftWidth: 4,
    borderLeftColor: '#6B9071',
    borderRadius: 6,
  },
  guideItemText: {
    fontSize: 13,
    color: '#2D5341',
    fontWeight: '500',
  },
  captureButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#E3EED4',
  },
  scanButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    backgroundColor: '#6B9071',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CameraScreen;
