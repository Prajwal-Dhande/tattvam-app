import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: February 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to Tattvam. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and share your data when you use our application.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          <Text style={{fontWeight: 'bold'}}>Personal Data:</Text> We collect your name and email address when you register an account.{"\n\n"}
          <Text style={{fontWeight: 'bold'}}>Local Data:</Text> Your dietary preferences, allergies, scan history, and favorites are stored securely on your device's local storage (AsyncStorage) to provide a personalized experience.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          • To provide, operate, and maintain our app.{"\n"}
          • To personalize the AI Chatbot's responses based on your health goals and strictness level.{"\n"}
          • To alert you about potential allergens in scanned products.
        </Text>

        <Text style={styles.sectionTitle}>4. Sharing Your Information</Text>
        <Text style={styles.paragraph}>
          We do not sell, rent, or trade your personal information to third parties. We use Google's Gemini AI API to process your queries about products, but your identity is kept anonymous during these API requests.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.paragraph}>
          We use administrative and technical security measures to help protect your personal information. However, please be aware that no electronic transmission over the internet can be guaranteed to be 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>6. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions or comments about this policy, you may email us at:{"\n"}
          <Text style={{fontWeight: 'bold', color: '#00C897'}}>tattvam.helpdesk@gmail.com</Text>
        </Text>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  
  content: { padding: 20, backgroundColor: '#F8FAFC' },
  lastUpdated: { fontSize: 13, color: '#94a3b8', marginBottom: 20, fontStyle: 'italic' },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 15, marginBottom: 10 },
  paragraph: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 10 }
});