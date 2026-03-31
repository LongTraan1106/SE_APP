import React, { useRef, useState, useEffect } from 'react';
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
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { PERMISSIONS, RESULTS, request } from 'react-native-permissions';

function CameraScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('back');
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
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto({
          qualityPrioritization: 'quality',
          skipMetadata: true,
        });
        setCapturedPhoto(`file://${photo.path}`);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chụp ảnh');
      console.error('Error taking photo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleGoBack = () => {
    setCapturedPhoto(null);
    navigation.goBack();
  };

  // Nếu có ảnh được chụp, hiển thị ảnh
  if (capturedPhoto) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.backButton}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ảnh đã chụp</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Captured Photo */}
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: capturedPhoto }}
            style={styles.capturedImage}
            resizeMode="contain"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.deleteButton]}
            onPress={handleDeletePhoto}
          >
            <Text style={styles.buttonText}>🗑 Xóa ảnh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.backCameraButton]}
            onPress={handleGoBack}
          >
            <Text style={styles.buttonText}>← Quay lại trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Nếu không có ảnh, hiển thị camera
  if (!device) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy camera</Text>
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

  // Nếu permission không được cấp
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
        <Text style={styles.headerTitle}>Camera</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Camera Wrapper */}
      <View style={styles.cameraWrapper}>
        <Camera
          ref={cameraRef}
          device={device}
          isActive={true}
          photo={true}
          style={styles.camera}
        />
      </View>

      {/* Capture Button */}
      <View style={styles.captureButtonContainer}>
        <TouchableOpacity
          style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
          onPress={handleTakePhoto}
          disabled={isLoading}
        >
          <View style={styles.captureButtonInner} />
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
  cameraWrapper: {
    flex: 1,
    overflow: 'hidden',
    margin:10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  camera: {
    flex: 1,
  },
  captureButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#E3EED4',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#6B9071',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#6B9071',
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
});

export default CameraScreen;
