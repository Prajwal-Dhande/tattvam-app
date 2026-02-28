import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
  SafeAreaView, Modal, Platform, TextInput, KeyboardAvoidingView 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen() {
  const navigation = useNavigation();
  
  // User Data States
  const [userInfo, setUserInfo] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ total: 0, healthy: 0, avoided: 0, score: 0 });
  
  // Preferences States
  const [diet, setDiet] = useState('None');
  const [allergies, setAllergies] = useState([]);
  
  // Modal States
  const [dietModal, setDietModal] = useState(false);
  const [allergyModal, setAllergyModal] = useState(false);
  
  // Name Edit States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState("");

  // Dynamic Greeting based on current time
  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return 'Good Morning,';
    } else if (currentHour < 18) {
      return 'Good Afternoon,';
    } else {
      return 'Good Evening,';
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('userInfo');
      if (userStr) setUserInfo(JSON.parse(userStr));

      const favStr = await AsyncStorage.getItem('tattvam_favorites');
      if (favStr) setFavorites(JSON.parse(favStr));

      const histStr = await AsyncStorage.getItem('tattvam_history');
      if (histStr) {
        const history = JSON.parse(histStr);
        let healthy = 0; let avoided = 0;
        history.forEach(item => {
          if (['A', 'B'].includes(item.nutriScore)) healthy++;
          if (['D', 'E'].includes(item.nutriScore)) avoided++;
        });
        
        let score = history.length > 0 ? Math.round((healthy / history.length) * 100) : 0;
        setStats({ total: history.length, healthy, avoided, score });
      }

      const savedPrefs = await AsyncStorage.getItem('tattvam_prefs');
      if (savedPrefs) {
        const p = JSON.parse(savedPrefs);
        if(p.diet) setDiet(p.diet);
        if(p.allergies) setAllergies(p.allergies);
      }
    } catch (error) {
      console.log("Profile Load Error", error);
    }
  };

  const savePreferences = async (key, value) => {
    try {
      const existing = await AsyncStorage.getItem('tattvam_prefs');
      const prefs = existing ? JSON.parse(existing) : {};
      prefs[key] = value;
      await AsyncStorage.setItem('tattvam_prefs', JSON.stringify(prefs));
    } catch (e) { console.log(e); }
  };

  const saveProfileName = async () => {
    if(!editName.trim()) return;
    const updatedUser = { ...userInfo, name: editName };
    setUserInfo(updatedUser);
    await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
    setEditModalVisible(false);
  };

  const toggleAllergy = (item) => {
    let newAllergies = [...allergies];
    if (newAllergies.includes(item)) newAllergies = newAllergies.filter(a => a !== item);
    else newAllergies.push(item);
    
    setAllergies(newAllergies);
    savePreferences('allergies', newAllergies);
  };

  const updateDiet = (item) => {
    setDiet(item);
    savePreferences('diet', item);
    setDietModal(false);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* GREEN HEADER */}
        <View style={styles.headerBackground}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{userInfo?.name?.split(' ')[0] || 'User'} 👋</Text>
            </View>
            <TouchableOpacity style={styles.gearBtn} onPress={() => navigation.navigate('Settings')}>
              <FontAwesome5 name="cog" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* MAIN PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInfo?.name?.substring(0, 2).toUpperCase() || 'US'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.cardName}>{userInfo?.name || 'Tattvam User'}</Text>
              <Text style={styles.cardEmail}>{userInfo?.email || 'user@tattvam.com'}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Healthy Eater</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.editPen} 
              onPress={() => { setEditName(userInfo?.name || ''); setEditModalVisible(true); }}
            >
              <FontAwesome5 name="pen" size={12} color="#00C897" />
            </TouchableOpacity>
          </View>

          <View style={styles.scoreSection}>
            <View style={styles.scoreRowText}>
              <Text style={styles.scoreTitle}>OVERALL HEALTH SCORE</Text>
              <Text style={[styles.scoreValue, {color: getScoreColor(stats.score)}]}>{stats.score}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${stats.score}%`, backgroundColor: getScoreColor(stats.score) }]} />
            </View>
            <Text style={styles.scoreSub}>Based on your scanned items</Text>
          </View>
        </View>

        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, {backgroundColor: '#f1f5f9'}]}><FontAwesome5 name="barcode" size={16} color="#64748b" /></View>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, {backgroundColor: '#dcfce3'}]}><FontAwesome5 name="leaf" size={16} color="#16a34a" /></View>
            <Text style={styles.statNum}>{stats.healthy}</Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.statIcon, {backgroundColor: '#fee2e2'}]}><FontAwesome5 name="exclamation-triangle" size={16} color="#dc2626" /></View>
            <Text style={styles.statNum}>{stats.avoided}</Text>
            <Text style={styles.statLabel}>Avoided</Text>
          </View>
        </View>

        {/* FAVORITES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Favorites</Text>
          <View style={styles.favBadge}><Text style={styles.favBadgeText}>{favorites.length} saved</Text></View>
        </View>
        
        {favorites.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.favScroll}>
            {favorites.map((fav, index) => (
              <TouchableOpacity key={index} style={styles.favCard} onPress={() => navigation.navigate('ProductDetail', { product: fav })}>
                <View style={styles.favImgBox}>
                  <Image source={{ uri: fav.imageUrl || fav.image || fav.img }} style={styles.favImg} resizeMode="contain" />
                </View>
                <Text style={styles.favName} numberOfLines={1}>{fav.name}</Text>
                <Text style={styles.favBrand} numberOfLines={1}>{fav.brand}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyFavText}>Like products to see them here.</Text>
        )}

        {/* HEALTH PROFILE SETTINGS */}
        <Text style={[styles.sectionTitle, { marginLeft: 20, marginTop: 10, marginBottom: 15 }]}>Health Profile</Text>
        <View style={styles.settingsMenu}>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setDietModal(true)}>
            <View style={[styles.menuIcon, {backgroundColor: '#dcfce3'}]}><FontAwesome5 name="apple-alt" size={16} color="#16a34a" /></View>
            <View style={{flex: 1}}><Text style={styles.menuText}>Dietary Preferences</Text></View>
            <Text style={styles.menuValue}>{diet}</Text>
            <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setAllergyModal(true)}>
            <View style={[styles.menuIcon, {backgroundColor: '#ffedd5'}]}><FontAwesome5 name="hand-paper" size={16} color="#ea580c" /></View>
            <View style={{flex: 1}}><Text style={styles.menuText}>Allergies & Intolerances</Text></View>
            <Text style={styles.menuValue}></Text>
            {allergies.length > 0 && <View style={styles.allergyDot}><Text style={styles.allergyDotText}>{allergies.length}</Text></View>}
            <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
          </TouchableOpacity>

        </View>
        
        <Text style={styles.versionText}>Tattvam v1.0.0 • Made with ❤️</Text>
        <View style={{height: 40}} />
      </ScrollView>

      {/* ======================================================= */}
      {/* ✏️ 1. EDIT PROFILE MODAL (FIXED KEYBOARD OVERLAP) */}
      {/* ======================================================= */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={[styles.smallModalContent, { paddingBottom: 25 }]}>
            <Text style={styles.modalTitle}>Edit Your Name</Text>
            <TextInput 
              style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, fontSize: 16, marginTop: 15, marginBottom: 20, color: '#1e293b' }}
              value={editName}
              onChangeText={setEditName}
              autoFocus
              placeholder="Enter full name"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 15, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' }} onPress={() => setEditModalVisible(false)}>
                <Text style={{ fontWeight: 'bold', color: '#64748b', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, padding: 15, backgroundColor: '#00C897', borderRadius: 12, alignItems: 'center' }} onPress={saveProfileName}>
                <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 15 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ======================================================= */}
      {/* 🍏 2. DIETARY PREFERENCES MODAL */}
      {/* ======================================================= */}
      <Modal visible={dietModal} transparent animationType="fade" onRequestClose={() => setDietModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Dietary Preferences</Text>
              <TouchableOpacity onPress={() => setDietModal(false)} style={styles.closeBtn}><FontAwesome5 name="times" size={16} color="#64748b" /></TouchableOpacity>
            </View>
            {['None', 'Vegan', 'Vegetarian', 'Keto', 'Paleo'].map(item => (
              <TouchableOpacity key={item} style={styles.radioRow} onPress={() => updateDiet(item)}>
                <Text style={styles.radioText}>{item}</Text>
                <View style={[styles.radioCircle, diet === item && styles.radioCircleActive]}>
                  {diet === item && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ======================================================= */}
      {/* 🥜 3. ALLERGIES MODAL */}
      {/* ======================================================= */}
      <Modal visible={allergyModal} transparent animationType="fade" onRequestClose={() => setAllergyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.smallModalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Allergies (Multiple)</Text>
              <TouchableOpacity onPress={() => setAllergyModal(false)} style={styles.closeBtn}><FontAwesome5 name="times" size={16} color="#64748b" /></TouchableOpacity>
            </View>
            <Text style={{color: '#64748b', fontSize: 13, marginBottom: 15}}>Scanner will warn you if these are found!</Text>
            <View style={styles.chipRow}>
              {['Peanuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Tree Nuts'].map(item => {
                const isSelected = allergies.includes(item);
                return (
                  <TouchableOpacity key={item} style={[styles.chip, isSelected && styles.chipDanger]} onPress={() => toggleAllergy(item)}>
                    <Text style={[styles.chipText, isSelected && {color: 'white'}]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#00C897' }, 
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  headerBackground: { backgroundColor: '#00C897', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  userName: { color: 'white', fontSize: 28, fontWeight: '900' },
  gearBtn: { width: 45, height: 45, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },

  profileCard: { backgroundColor: 'white', marginHorizontal: 20, marginTop: -40, borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, elevation: 5 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#00C897', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  cardEmail: { fontSize: 12, color: '#64748b', marginBottom: 5 },
  badge: { backgroundColor: '#e0f8f1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { color: '#00C897', fontSize: 10, fontWeight: 'bold' },
  editPen: { padding: 10, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },

  scoreSection: { backgroundColor: '#f8fafc', padding: 15, borderRadius: 16 },
  scoreRowText: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  scoreTitle: { fontSize: 11, fontWeight: 'bold', color: '#475569', letterSpacing: 0.5 },
  scoreValue: { fontSize: 20, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  scoreSub: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic' },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, gap: 15 },
  statBox: { flex: 1, backgroundColor: 'white', padding: 15, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statNum: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  favBadge: { backgroundColor: '#ccfbf1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  favBadgeText: { color: '#0d9488', fontSize: 11, fontWeight: 'bold' },
  favScroll: { paddingLeft: 20, paddingBottom: 10 },
  favCard: { width: 110, backgroundColor: 'white', padding: 10, borderRadius: 16, marginRight: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  favImgBox: { width: '100%', height: 80, backgroundColor: '#f8fafc', borderRadius: 10, padding: 5, marginBottom: 8 },
  favImg: { width: '100%', height: '100%' },
  favName: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  favBrand: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' },
  emptyFavText: { paddingHorizontal: 20, color: '#94a3b8', fontStyle: 'italic', fontSize: 13 },

  settingsMenu: { backgroundColor: 'white', marginHorizontal: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuText: { fontSize: 15, fontWeight: 'bold', color: '#334155' },
  menuValue: { fontSize: 13, color: '#00C897', fontWeight: 'bold', marginRight: 10 },
  allergyDot: { backgroundColor: '#ef4444', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  allergyDotText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 65 },

  versionText: { textAlign: 'center', marginTop: 30, color: '#94a3b8', fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  smallModalContent: { backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
  
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f1f5f9', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  chipDanger: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#475569' },

  radioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  radioText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  radioCircleActive: { borderColor: '#00C897' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#00C897' }
});