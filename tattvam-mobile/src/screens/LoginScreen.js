import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      alert("Bhai, saari details dhang se bhar!");
      return;
    }
    
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
      const payload = isLogin ? { email, password } : { name, email, password };

      const response = await fetch(`https://nonpapistical-prohibitively-dulcie.ngrok-free.dev${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userInfo', JSON.stringify(data));
        setLoading(false);
        navigation.replace('MainTabs'); 
      } else {
        setLoading(false);
        alert(data.message || 'Authentication failed. Please try again.');
      }
    } catch (error) {
      console.error("Auth Error:", error);
      setLoading(false);
      alert("Server se connect nahi ho raha. Apna Backend chalu hai na?");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.innerContainer}
      >
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            {/* ✅ FIXED: Changed color from "white" to "#00C897" */}
            <FontAwesome5 name="leaf" size={40} color="#00C897" />
          </View>
          <Text style={styles.brandTitle}>Tattvam</Text>
          <Text style={styles.subTitle}>EAT SMART, LIVE BETTER</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>
          <Text style={styles.formSubtitle}>
            {isLogin ? 'Login to continue your healthy food journey.' : 'Join Tattvam and eat healthier today.'}
          </Text>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <FontAwesome5 name="user" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Full Name" 
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <FontAwesome5 name="envelope" size={16} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.passwordContainer}>
            <FontAwesome5 name="lock" size={16} color="#94a3b8" style={styles.inputIcon} />
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Password" 
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {isLogin && (
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.authBtn} onPress={handleAuth} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.authBtnText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>{isLogin ? 'Sign Up' : 'Login'}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#00C897' }, 
  innerContainer: { flex: 1, justifyContent: 'center', padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 35, marginTop: 10 },
  logoCircle: { width: 85, height: 85, backgroundColor: 'white', borderRadius: 42.5, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  brandTitle: { fontSize: 36, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  subTitle: { fontSize: 12, fontWeight: 'bold', color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginTop: 5 },
  
  formContainer: { backgroundColor: 'white', padding: 25, borderRadius: 28, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 25, elevation: 8 },
  formTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  formSubtitle: { fontSize: 14, color: '#64748b', marginBottom: 25, lineHeight: 20 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 15, paddingHorizontal: 15, height: 58, borderWidth: 1, borderColor: '#f1f5f9' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, marginBottom: 15, paddingLeft: 15, height: 58, borderWidth: 1, borderColor: '#f1f5f9' },
  
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '500' },
  passwordInput: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '500', paddingVertical: 15 },
  eyeBtn: { padding: 15, justifyContent: 'center', alignItems: 'center' },
  
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25, marginTop: -5 },
  forgotText: { color: '#00C897', fontWeight: 'bold', fontSize: 14 },
  
  authBtn: { backgroundColor: '#00C897', height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#00C897', shadowOpacity: 0.4, shadowRadius: 15, elevation: 6 },
  authBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '500' },
  toggleText: { color: 'white', fontSize: 15, fontWeight: 'bold', textDecorationLine: 'underline' }
});