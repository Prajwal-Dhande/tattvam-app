import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Modal, Alert, ScrollView, Image
} from 'react-native';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP States (Registration)
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Forgot Password States
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Request, 2 = Reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);


  // ⚠️ Ensure this points to Render to test externally without local firewall limits!
  const BASE_URL = 'https://tattvam-app.onrender.com';

  // ============================================
  // 🔑 GOOGLE AUTHENTICATION SETUP
  // ============================================
  // REPLACE these with your actual Client IDs from Google Cloud Console.
  const GOOGLE_WEB_CLIENT_ID = "340681503583-jhac8juobo6f9fn41e29rqrd1n7v5l22.apps.googleusercontent.com";
  const GOOGLE_ANDROID_CLIENT_ID = "340681503583-8etehjbfcqgeorjs1mta69pj3e7jluqr.apps.googleusercontent.com";

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID.includes('YOUR_ANDROID') ? GOOGLE_WEB_CLIENT_ID : GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_WEB_CLIENT_ID, 
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfoFromGoogle(authentication.accessToken);
    }
  }, [response]);

  const fetchUserInfoFromGoogle = async (token) => {
    setLoading(true);
    try {
      const gRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = await gRes.json();

      const rawResponse = await fetch(`${BASE_URL}/api/users/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name, googleId: user.id })
      });
      const data = await rawResponse.json();
      setLoading(false);

      if (rawResponse.ok) {
        await AsyncStorage.setItem('userInfo', JSON.stringify(data));
        navigation.replace('MainTabs');
      } else {
        alert(data.message || 'Google Login failed on our server.');
      }
    } catch (err) {
      setLoading(false);
      alert('Failed to connect to Google or our Server.');
    }
  };


  const handleAuth = async () => {
    if (!email || !password || (!isLogin && (!name || !confirmPassword))) {
      alert("Please fill in all the details correctly.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
      const payload = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        if (isLogin) {
          await AsyncStorage.setItem('userInfo', JSON.stringify(data));
          navigation.replace('MainTabs');
        } else {
          Alert.alert("Success", "An OTP has been sent to your email!");
          setOtpModalVisible(true);
        }
      } else {
        alert(data.message || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error("Auth Error:", error);
      setLoading(false);
      alert("Unable to connect to the server. Please check your network connection.");
    }
  };

  const verifyOtp = async () => {
    if (!otpCode || otpCode.length < 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();
      setOtpLoading(false);

      if (response.ok) {
        setOtpModalVisible(false);
        await AsyncStorage.setItem('userInfo', JSON.stringify(data));
        navigation.replace('MainTabs');
      } else {
        alert(data.message || "Invalid OTP. Please try again.");
      }

    } catch (error) {
      console.error("OTP Error:", error);
      setOtpLoading(false);
      alert("Network Error. Please try again.");
    }
  };

  // Google Sign In Button Handler
  const handleGoogleSignIn = () => {
    if (GOOGLE_WEB_CLIENT_ID.includes('YOUR_WEB_CLIENT_ID')) {
      Alert.alert("Setup Required", "Please replace the GOOGLE_WEB_CLIENT_ID in the code with your actual Client ID from Google Cloud Console to enable Google Auth.");
      return;
    }
    promptAsync();
  };

  // Forgot Password Setup
  const handleForgotPasswordRequest = async () => {
    if (!forgotEmail) {
      alert("Please enter your registered email.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await response.json();
      setForgotLoading(false);

      if (response.ok) {
        setForgotStep(2);
      } else {
        alert(data.message || "Failed to send reset code.");
      }
    } catch (error) {
      setForgotLoading(false);
      alert("Network Error. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp || !newPassword) {
      alert("Please enter the OTP and the new password.");
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword })
      });
      const data = await response.json();
      setForgotLoading(false);

      if (response.ok) {
        Alert.alert("Success", "Password reset successfully. You can now login.");
        setForgotModalVisible(false);
        setForgotStep(1);
        setForgotOtp('');
        setNewPassword('');
        setForgotEmail('');
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (error) {
      setForgotLoading(false);
      alert("Network Error. Please try again.");
    }
  };

  const openForgotModal = () => {
    setForgotEmail(email);
    setForgotStep(1);
    setForgotModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background abstract elements */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={styles.headerContainer}>
            <View style={styles.logoCircle}>
              <FontAwesome5 name="leaf" size={40} color="#00E676" />
            </View>
            <Text style={styles.brandTitle}>Tattvam</Text>
            <Text style={styles.subTitle}>EAT SMART, LIVE BETTER</Text>
          </View>

          <View style={styles.formGlassmorphism}>
            <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.formSubtitle}>
              {isLogin ? 'Enter your details to proceed.' : 'Join Tattvam and eat healthier today.'}
            </Text>

            {/* Input Fields */}
            {!isLogin && (
              <View style={styles.inputContainer}>
                <FontAwesome5 name="user" size={16} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#64748B"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <FontAwesome5 name="envelope" size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.passwordContainer}>
              <FontAwesome5 name="lock" size={16} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="#64748B"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} size={16} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password Field */}
            {!isLogin && (
              <View style={styles.passwordContainer}>
                <FontAwesome5 name="shield-alt" size={16} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                  <FontAwesome5 name={showConfirmPassword ? "eye" : "eye-slash"} size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}

            {isLogin && (
              <TouchableOpacity style={styles.forgotBtn} onPress={openForgotModal}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color="#0B0F19" />
              ) : (
                <Text style={styles.authBtnText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
              )}
            </TouchableOpacity>

            {/* Social Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.8}>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.googleIcon} />
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setIsLogin(!isLogin)} activeOpacity={0.7}>
                <Text style={styles.toggleText}>{isLogin ? 'Create one' : 'Sign in'}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ======================================================= */}
      {/* 🔐 OTP VERIFICATION MODAL */}
      {/* ======================================================= */}
      <Modal visible={otpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.1)' }]}>
              <FontAwesome5 name="envelope-open-text" size={28} color="#00E676" />
            </View>
            <Text style={styles.modalTitle}>Verify Your Email</Text>
            <Text style={styles.modalSubtitle}>
              We've sent a 6-digit code to <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{email}</Text>
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#64748B"
              keyboardType="numeric"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
              textAlign="center"
            />

            <TouchableOpacity style={styles.modalVerifyBtn} onPress={verifyOtp} disabled={otpLoading}>
              {otpLoading ? <ActivityIndicator color="#0B0F19" /> : <Text style={styles.modalVerifyBtnText}>Verify & Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setOtpModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================= */}
      {/* 🔑 FORGOT PASSWORD MODAL */}
      {/* ======================================================= */}
      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconBox, { backgroundColor: 'rgba(234, 179, 8, 0.1)' }]}>
              <FontAwesome5 name="key" size={28} color="#EAB308" />
            </View>

            {forgotStep === 1 ? (
              <>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSubtitle}>Enter your registered email to receive a password reset OTP.</Text>

                <TextInput
                  style={[styles.modalInput, { letterSpacing: 1, textAlign: 'left', paddingHorizontal: 20 }]}
                  placeholder="Email Address"
                  placeholderTextColor="#64748B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />

                <TouchableOpacity style={[styles.modalVerifyBtn, { backgroundColor: '#EAB308', shadowColor: '#EAB308' }]} onPress={handleForgotPasswordRequest} disabled={forgotLoading}>
                  {forgotLoading ? <ActivityIndicator color="#0B0F19" /> : <Text style={styles.modalVerifyBtnText}>Send Reset Code</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>New Password</Text>
                <Text style={styles.modalSubtitle}>Enter the OTP sent to your email and create a new password.</Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="6-digit OTP"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  maxLength={6}
                  value={forgotOtp}
                  onChangeText={setForgotOtp}
                  textAlign="center"
                />

                <TextInput
                  style={[styles.modalInput, { letterSpacing: 1, textAlign: 'left', paddingHorizontal: 20 }]}
                  placeholder="New Password"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <TouchableOpacity style={[styles.modalVerifyBtn, { backgroundColor: '#EAB308', shadowColor: '#EAB308' }]} onPress={handleResetPassword} disabled={forgotLoading}>
                  {forgotLoading ? <ActivityIndicator color="#0B0F19" /> : <Text style={styles.modalVerifyBtnText}>Update Password</Text>}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setForgotModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6EE7B7', // Richer light-medium green background
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#34D399', // Stronger green circle
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: '#10B981', // Darker green circle for depth
  },
  innerContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
    zIndex: 1,
  },
  logoCircle: {
    width: 65,
    height: 65,
    backgroundColor: '#FFFFFF',
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#064E3B',
    letterSpacing: 2,
    marginTop: 4,
  },

  formGlassmorphism: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // High opacity white glass
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 1,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 24,
    lineHeight: 18,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 14,
    paddingLeft: 14,
    height: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  inputIcon: { marginRight: 10, width: 20, textAlign: 'center', color: '#94A3B8' },
  input: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500' },
  passwordInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '500', paddingVertical: 10 },
  eyeBtn: { padding: 12, justifyContent: 'center', alignItems: 'center' },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -5 },
  forgotText: { color: '#059669', fontWeight: '700', fontSize: 13 },

  authBtn: {
    backgroundColor: '#059669',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  authBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  googleBtnText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
  },

  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  toggleText: { color: '#059669', fontSize: 14, fontWeight: '700', marginLeft: 4 },

  // Modals Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
    letterSpacing: 1,
  },
  modalVerifyBtn: {
    width: '100%',
    backgroundColor: '#059669',
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalVerifyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalCancelBtn: { marginTop: 16, padding: 8 },
  modalCancelText: { color: '#64748B', fontSize: 14, fontWeight: '700' }
});