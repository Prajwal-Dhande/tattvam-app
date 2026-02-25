import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Switch, Alert, Platform, Linking, Share, Modal 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const navigation = useNavigation();
  
  // Preferences States
  const [aiMode, setAiMode] = useState('Strict Dietitian');
  const [healthGoal, setHealthGoal] = useState('Weight Loss');
  const [pushEnabled, setPushEnabled] = useState(true);

  // Modals State
  const [languageModal, setLanguageModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('tattvam_prefs');
      if (savedPrefs) {
        const p = JSON.parse(savedPrefs);
        if(p.aiMode) setAiMode(p.aiMode);
        if(p.healthGoal) setHealthGoal(p.healthGoal);
        if(p.language) setSelectedLang(p.language);
      }
    } catch (e) { console.log(e); }
  };

  const savePreference = async (key, value) => {
    try {
      const existing = await AsyncStorage.getItem('tattvam_prefs');
      const prefs = existing ? JSON.parse(existing) : {};
      prefs[key] = value;
      await AsyncStorage.setItem('tattvam_prefs', JSON.stringify(prefs));
    } catch (e) { console.log(e); }
  };

  // ✅ ACTION FUNCTIONS
  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Hey! I am using Tattvam to scan my food and eat healthier. Download it now to see what hidden ingredients are in your snacks! 🥗📲',
      });
    } catch (error) {
      console.log('Error sharing app:', error);
    }
  };

  const handleSupportEmail = () => {
    Linking.openURL('mailto:tattvam.helpdesk@gmail.com?subject=Tattvam App Support Request&body=Hi Team Tattvam, I need help with...');
  };

  const handleRateUs = () => {
    // Dummy Play Store Link format
    Linking.openURL('market://details?id=com.tattvam.app').catch(() => {
      Alert.alert("Play Store Error", "The Google Play Store is not available on this device.");
    });
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open the requested link."));
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Log Out", 
        style: "destructive", 
        onPress: async () => {
          await AsyncStorage.removeItem('userInfo');
          navigation.replace('Login');
        } 
      }
    ]);
  };

  // ✅ FIXED: Permanent Account Deletion Logic
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account", 
      "This action is permanent and cannot be undone. All your scans, favorites, and preferences will be permanently wiped.", 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Permanently", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Perform complete local data wipe
              await AsyncStorage.multiRemove([
                'userInfo', 'tattvam_history', 'tattvam_favorites', 'tattvam_prefs'
              ]);
              Alert.alert("Account Deleted", "Your account and data have been successfully removed.");
              navigation.replace('Login'); // Redirect to login screen
            } catch(e) { console.log(e); }
          } 
        }
      ]
    );
  };

  // Reusable Component for List Items
  const SettingItem = ({ icon, title, color, onPress, showArrow = true, rightComponent, subText }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
          <FontAwesome5 name={icon} size={16} color={color} />
        </View>
        <View>
          <Text style={styles.settingItemText}>{title}</Text>
          {subText && <Text style={styles.settingItemSub}>{subText}</Text>}
        </View>
      </View>
      {rightComponent ? rightComponent : showArrow && <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        <Text style={styles.sectionHeader}>Tattvam AI Engine</Text>
        <View style={styles.card}>
          <Text style={styles.cardSubTitle}>AI Coach Strictness</Text>
          <View style={styles.chipRow}>
            {['Casual', 'Strict Dietitian', 'Gym Bro'].map(mode => (
              <TouchableOpacity 
                key={mode} 
                style={[styles.chip, aiMode === mode && styles.chipActive]} 
                onPress={() => { setAiMode(mode); savePreference('aiMode', mode); }}
              >
                <Text style={[styles.chipText, aiMode === mode && styles.chipTextActive]}>{mode}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardSubTitle}>Current Health Goal</Text>
          <View style={styles.chipRow}>
            {['Weight Loss', 'Muscle Gain', 'Maintain Health'].map(goal => (
              <TouchableOpacity 
                key={goal} 
                style={[styles.chip, healthGoal === goal && styles.chipActive]} 
                onPress={() => { setHealthGoal(goal); savePreference('healthGoal', goal); }}
              >
                <Text style={[styles.chipText, healthGoal === goal && styles.chipTextActive]}>{goal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeader}>General</Text>
        <View style={styles.card}>
          <SettingItem 
            icon="bell" title="Push Notifications" color="#3b82f6" showArrow={false}
            rightComponent={<Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: "#cbd5e1", true: "#00C897" }} />} 
          />
          <View style={styles.dividerMenu} />
          <SettingItem 
            icon="language" title="App Language" color="#8b5cf6" 
            subText={selectedLang}
            onPress={() => setLanguageModal(true)} 
          />
        </View>

        <Text style={styles.sectionHeader}>Support & About</Text>
        <View style={styles.card}>
          <SettingItem icon="headset" title="Help & Support" color="#10b981" onPress={handleSupportEmail} />
          <View style={styles.dividerMenu} />
          <SettingItem icon="star" title="Rate Us on Play Store" color="#eab308" onPress={handleRateUs} />
          <View style={styles.dividerMenu} />
          <SettingItem icon="share-alt" title="Share Tattvam" color="#f97316" onPress={handleShareApp} />
          <View style={styles.dividerMenu} />
          <SettingItem icon="shield-alt" title="Privacy Policy" color="#64748b" onPress={() => navigation.navigate('PrivacyPolicy')} />
          <View style={styles.dividerMenu} />
          <SettingItem icon="info-circle" title="About Tattvam" color="#64748b" onPress={() => setAboutModal(true)} />
        </View>

        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <FontAwesome5 name="sign-out-alt" size={16} color="#ef4444" />
              </View>
              <Text style={[styles.settingItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.dividerMenu} />
          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <View style={styles.settingItemLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
              </View>
              <Text style={[styles.settingItemText, { color: '#ef4444', fontWeight: 'bold' }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Tattvam Version 1.0.0 (Build 12)</Text>

      </ScrollView>

      {/* 🌍 LANGUAGE MODAL */}
      <Modal visible={languageModal} transparent animationType="fade" onRequestClose={() => setLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>App Language</Text>
              <TouchableOpacity onPress={() => setLanguageModal(false)} style={styles.closeBtn}><FontAwesome5 name="times" size={16} color="#64748b" /></TouchableOpacity>
            </View>
            {['English', 'Hindi (Coming Soon)', 'Marathi (Coming Soon)'].map(lang => {
              const isSelected = selectedLang === lang;
              const isAvailable = lang === 'English';
              return (
                <TouchableOpacity 
                  key={lang} 
                  style={[styles.radioRow, !isAvailable && { opacity: 0.5 }]} 
                  disabled={!isAvailable}
                  onPress={() => { setSelectedLang(lang); savePreference('language', lang); setLanguageModal(false); }}
                >
                  <Text style={styles.radioText}>{lang}</Text>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </Modal>

      {/* ℹ️ ABOUT US MODAL */}
      <Modal visible={aboutModal} transparent animationType="slide" onRequestClose={() => setAboutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.aboutModalContent}>
            <TouchableOpacity onPress={() => setAboutModal(false)} style={styles.aboutCloseBtn}>
              <FontAwesome5 name="times" size={20} color="#94a3b8" />
            </TouchableOpacity>
            
            <View style={styles.aboutLogoBox}>
              <FontAwesome5 name="leaf" size={40} color="white" />
            </View>
            <Text style={styles.aboutAppTitle}>Tattvam</Text>
            <Text style={styles.aboutAppSub}>Eat Smart, Live Better</Text>
            
            <View style={styles.aboutTextContainer}>
              <Text style={styles.aboutDescription}>
                Tattvam is an intelligent food scanner that uses advanced Gemini AI to break down complex ingredients, making healthy choices easier for everyone.
              </Text>
              
              <View style={styles.developerBox}>
                <Text style={styles.devTitle}>DESIGNED & DEVELOPED BY</Text>
                <Text style={styles.devName}>Prajwal Dhande</Text>
                <Text style={styles.devRole}>AI Engineer • Nagpur, India</Text>
                <TouchableOpacity style={styles.contactBtn} onPress={handleSupportEmail}>
                  <Text style={styles.contactBtnText}>Get in Touch</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  
  content: { backgroundColor: '#F8FAFC', padding: 20 },
  
  sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5, letterSpacing: 0.5 },
  
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 25, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  
  cardSubTitle: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#e0f8f1', borderColor: '#00C897' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#00C897', fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },
  dividerMenu: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 50 },

  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingItemText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  settingItemSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  
  versionText: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 10, fontWeight: '600' },

  // Modals Core
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  smallModalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },

  // Radio Buttons
  radioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  radioText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: '#00C897' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00C897' },

  // About Modal Specific
  aboutModalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, alignItems: 'center', paddingBottom: 50 },
  aboutCloseBtn: { position: 'absolute', top: 20, right: 20, padding: 10 },
  aboutLogoBox: { width: 80, height: 80, backgroundColor: '#00C897', borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 15, shadowColor: '#00C897', shadowOpacity: 0.3, shadowRadius: 15, elevation: 5 },
  aboutAppTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 5 },
  aboutAppSub: { fontSize: 14, color: '#00C897', fontWeight: 'bold', marginBottom: 25 },
  aboutTextContainer: { width: '100%', backgroundColor: '#f8fafc', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  aboutDescription: { fontSize: 14, color: '#475569', lineHeight: 22, textAlign: 'center', marginBottom: 25 },
  
  developerBox: { alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 20 },
  devTitle: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', letterSpacing: 1, marginBottom: 5 },
  devName: { fontSize: 18, color: '#1e293b', fontWeight: '900', marginBottom: 2 },
  devRole: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 15 },
  contactBtn: { backgroundColor: '#0f172a', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  contactBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 }
});