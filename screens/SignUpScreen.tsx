import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { CloudIcon } from '../components/CloudIcon';
import { useAuth } from '../contexts/AuthContext';
import OpenEyeIcon from '../assets/icons/open_eye.svg';
import CloseEyeIcon from '../assets/icons/close_eye.svg';

const { width, height } = Dimensions.get('window');

function SignUpScreen() {
  const navigation = useNavigation<any>();
  const { signUp, loading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [username, email, password, confirmPassword]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string) => {
    // Min 6 chars, must have uppercase and number
    if (password.length < 6) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  };

  const validateInputs = (): boolean => {
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (username.trim().length > 20) {
      newErrors.username = 'Username must not exceed 20 characters';
    } else if (!validateUsername(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscore';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Email must be in format: user@gmail.com';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be 6+ chars with uppercase and number';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return (
      !newErrors.username &&
      !newErrors.email &&
      !newErrors.password &&
      !newErrors.confirmPassword
    );
  };

  const handleSignUp = async () => {
    if (!validateInputs()) {
      return;
    }

    try {
      await signUp({
        username: username.trim(),
        email: email.trim(),
        password: password,
      });
      // Navigation will be handled by RootNavigator when isLoggedIn changes
    } catch (err) {
      // Error is already set in context
      Alert.alert(
        'Sign Up Failed',
        err instanceof Error ? err.message : 'An error occurred during sign up'
      );
    }
  };

  const handleNavigateToSignIn = () => {
    clearError();
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({ username: '', email: '', password: '', confirmPassword: '' });
    navigation.navigate('SignIn');
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
        {/* Top Section with Welcome Text */}
        <View style={styles.topSection}>
          <Text style={styles.welcomeText}>WELCOME !</Text>

          <View style={styles.iconContainer}>
            <Image
              source={require('../assets/fig.png')}
              style={styles.figImage}
            />
          </View>
        </View>
        <View style={styles.form_container}>
          {/* Sign Up Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>SIGN UP</Text>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorAlert}>{error}</Text>
              </View>
            )}

            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Username"
                placeholderTextColor="#B0B0B0"
                value={username}
                onChangeText={setUsername}
                editable={!loading}
                maxLength={20}
              />
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email address (@gmail.com)"
                placeholderTextColor="#B0B0B0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={[styles.passwordContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password (6+, Uppercase, Number)"
                  placeholderTextColor="#B0B0B0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <OpenEyeIcon width={20} height={20} />
                  ) : (
                    <CloseEyeIcon width={20} height={20} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.passwordContainer,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm password"
                  placeholderTextColor="#B0B0B0"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  {showConfirmPassword ? (
                    <OpenEyeIcon width={20} height={20} />
                  ) : (
                    <CloseEyeIcon width={20} height={20} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.continueButton, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.signInLinkContainer}>
              <Text style={styles.signInLinkText}>Already have an account ?, </Text>
              <TouchableOpacity
                onPress={handleNavigateToSignIn}
                disabled={loading}
              >
                <Text style={styles.signInLinkBold}>SIGN IN</Text>
              </TouchableOpacity>
              <Text style={styles.signInLinkText}> here.</Text>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#E5EFD7',
    // marginTop: 20,
  },
  topSection: {
    backgroundColor: '#E5EFD7',
    // paddingTop: 40,
    paddingBottom: 70,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: height * 0.4,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D5A3D',
    marginBottom: 20,
    paddingLeft: width * 0.4,
    letterSpacing: 1,
    
  },
  iconContainer: {
    width: 180,
    height: 130,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: height * 0.05,
  },
  figImage: {
    width: width * 0.8,
    height: height * 0.8,
    resizeMode: 'contain',
  },
  form_container: {
    flex: 1,
    justifyContent: 'flex-end',
    // marginBottom: 20,
    height: height * 0.5,
    backgroundColor: '#A9B9A8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  formSection: {
    backgroundColor: '#A9B9A8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    height: "100%",
    // minHeight: height * 0.7,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D5A3D',
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 1,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  errorAlert: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    color: '#333333',
    fontFamily: 'System',
    width: width * 0.8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#333333',
    borderRadius: 16,
    paddingHorizontal: 18,
    width: width * 0.8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#333333',
    fontFamily: 'System',
  },
  eyeIcon: {
    // padding: 8,
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 5,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#697E63',
    color: '#BED2BC',
    width: width * 0.5,
    borderRadius: 24,
    paddingVertical: 14,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#BED2BC',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  signInLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    flexWrap: 'wrap',
  },
  signInLinkText: {
    fontSize: 14,
    color: '#2D5A3D',
    fontWeight: '400',
  },
  signInLinkBold: {
    fontSize: 14,
    color: '#2D5A3D',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
