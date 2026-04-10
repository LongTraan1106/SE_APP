import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';
import DocumentScanner from '@dariyd/react-native-document-scanner';

function CameraScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const permission = Platform.OS === 'android' 
        ? PERMISSIONS.ANDROID.CAMERA 
        : PERMISSIONS.IOS.CAMERA;
      
      const result = await request(permission);
      
      if (result === RESULTS.GRANTED) {
        setCameraPermission(true);
      } else {
        setCameraPermission(false);
        Alert.alert(
          'Quyền Camera Bị Từ Chối',
          'Ứng dụng cần quyền truy cập camera để hoạt động. Vui lòng bật quyền camera trong cài đặt.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      setCameraPermission(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      
      DocumentScanner.launchScanner({}, (result: any) => {
        setIsLoading(false);
        
        if (result && result.length > 0) {
          // result là array của scanned images (uri)
          const scannedImageUri = result[0];
          setCapturedPhoto(scannedImageUri);
        }
      });
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Lỗi', 'Không thể quét tài liệu');
      console.error('Error scanning document:', error);
    }
  };

  const handleDeletePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleGoBack = () => {
    setCapturedPhoto(null);
    navigation.goBack();
  };

  // // Nếu có ảnh được chụp, hiển thị ảnh
  // if (capturedPhoto) {
  //   return (
  //     <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
  //       {/* Header */}
  //       <View style={styles.header}>
  //         <TouchableOpacity onPress={handleGoBack}>
  //           <Text style={styles.backButton}>← Quay lại</Text>
  //         </TouchableOpacity>
  //         <Text style={styles.headerTitle}>Ảnh đã chụp</Text>
  //         <View style={{ width: 60 }} />
  //       </View>

  //       {/* Captured Photo */}
  //       <View style={styles.photoContainer}>
  //         <Image
  //           source={{ uri: capturedPhoto }}
  //           style={styles.capturedImage}
  //           resizeMode="contain"
  //         />
  //       </View>

  //       {/* Action Buttons */}
  //       <View style={styles.buttonContainer}>
  //         <TouchableOpacity
  //           style={[styles.button, styles.deleteButton]}
  //           onPress={handleDeletePhoto}
  //         >
  //           <Text style={styles.buttonText}>🗑 Xóa ảnh</Text>
  //         </TouchableOpacity>

  //         <TouchableOpacity
  //           style={[styles.button, styles.backCameraButton]}
  //           onPress={handleGoBack}
  //         >
  //           <Text style={styles.buttonText}>← Quay lại trang chủ</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // }

  // Nếu không có ảnh, hiển thị menu quét tài liệu
  if (cameraPermission === false) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Quyền Camera Bị Từ Chối</Text>
          <Text style={styles.errorSubText}>
            Vui lòng bật quyền camera trong cài đặt ứng dụng
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.backCameraButton]}
            onPress={handleGoBack}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Nếu permission đang kiểm tra
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
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quét Tài Liệu</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Main Content */}
      <View style={styles.scannerGuideContainer}>
        <Text style={styles.guideTitleText}>📄 Quét Tài Liệu của Bạn</Text>
        <Text style={styles.guideDescriptionText}>
          Bấm nút dưới để bắt đầu quét tài liệu. Hệ thống sẽ tự động phát hiện các cạnh của tài liệu và cắt chính xác.
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
            {isLoading ? '⏳ Đang quét...' : '📷 Quét Tài Liệu'}
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
    margin:5,
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
  photoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  capturedImage: {
    width: '90%',
    height: '80%',
  },
  buttonContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#f5f5f5',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  backCameraButton: {
    backgroundColor: '#6B9071',
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
