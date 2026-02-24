import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, SafeAreaView 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ SMART DICTIONARY: Inko dekhte hi app automatically RED (Unhealthy) mark karegi
const DANGEROUS_INGREDIENTS = [
  'palm', 'palmolein', 'sugar', 'syrup', 'glucose', 'fructose', 'maltodextrin', 
  'refined wheat flour', 'maida', 'interesterified', 'hydrogenated', 'artificial', 
  'flavour', 'flavor', 'colour', 'color', 'preservative', 'emulsifier', 'sweetener', 
  'sucralose', 'aspartame', 'saccharin', 'msg', 'caramel', '322', '471', '500', '503', 
  'raising agent', 'acidity regulator', 'stabilizer', 'iodised salt'
];

export default function ProductDetailScreen({ route, navigation }) {
  const p = route?.params?.product;
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlts, setLoadingAlts] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // AI Chat States
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]); 
  const [aiLoading, setAiLoading] = useState(false);
  const scrollViewRef = useRef();

  // Allergy Detection State
  const [detectedAllergies, setDetectedAllergies] = useState([]);

  const warnings = p?.warnings || [];
  let rawIngredients = p?.ingredients || [];
  const backendBadIngredients = p?.badIngredients || [];
  const nutrition = p?.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  // Ingredient Formatting
  let cleanIngredients = [];
  if (Array.isArray(rawIngredients)) {
    if (rawIngredients.length === 1 && rawIngredients[0].includes('\n')) {
      cleanIngredients = rawIngredients[0].split('\n');
    } else {
      cleanIngredients = rawIngredients;
    }
  } else if (typeof rawIngredients === 'string') {
    cleanIngredients = rawIngredients.split(rawIngredients.includes('\n') ? '\n' : ',');
  }
  cleanIngredients = cleanIngredients.map(i => i.replace(/&lt;/g, '<').trim()).filter(i => i.length > 0);

  // Load History & Favorites
  useEffect(() => {
    const saveToHistory = async () => {
      if (!p || !p.barcode) return;
      try {
        const existingHistory = await AsyncStorage.getItem('tattvam_history');
        let historyArray = existingHistory ? JSON.parse(existingHistory) : [];
        historyArray = historyArray.filter(item => item.barcode !== p.barcode);
        historyArray.unshift(p);
        if (historyArray.length > 20) historyArray.pop();
        await AsyncStorage.setItem('tattvam_history', JSON.stringify(historyArray));
      } catch (e) {}
    };
    saveToHistory();
  }, [p]);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!p || !p.barcode) return;
      try {
        const existingFavs = await AsyncStorage.getItem('tattvam_favorites');
        if (existingFavs) {
          const favArray = JSON.parse(existingFavs);
          setIsFavorite(favArray.some(item => item.barcode === p.barcode));
        }
      } catch (e) {}
    };
    checkFavorite();
  }, [p]);

  // SMART ALLERGY CHECKER
  useEffect(() => {
    const checkAllergies = async () => {
      try {
        const prefsStr = await AsyncStorage.getItem('tattvam_prefs');
        if (prefsStr) {
          const prefs = JSON.parse(prefsStr);
          if (prefs.allergies && prefs.allergies.length > 0) {
            const allergyMap = {
              'Peanuts': ['peanut', 'groundnut'],
              'Dairy': ['milk', 'cheese', 'butter', 'whey', 'lactose', 'casein', 'cream', 'paneer', 'ghee'],
              'Gluten': ['wheat', 'flour', 'barley', 'rye', 'malt', 'maida', 'suji'],
              'Soy': ['soy', 'soya', 'edamame', 'tofu'],
              'Eggs': ['egg', 'albumen', 'mayonnaise'],
              'Tree Nuts': ['almond', 'cashew', 'walnut', 'pecan', 'hazelnut', 'macadamia', 'pistachio', 'nut']
            };

            let found = [];
            const ingredientsText = (p?.ingredients ? (Array.isArray(p.ingredients) ? p.ingredients.join(' ') : p.ingredients) : '').toLowerCase();

            prefs.allergies.forEach(allergy => {
              const keywords = allergyMap[allergy] || [allergy.toLowerCase()];
              if (keywords.some(kw => ingredientsText.includes(kw))) {
                found.push(allergy);
              }
            });

            setDetectedAllergies(found);
          }
        }
      } catch (e) {
        console.log("Allergy check error", e);
      }
    };
    checkAllergies();
  }, [p]);

  const toggleFavorite = async () => {
    if (!p || !p.barcode) return;
    try {
      const existingFavs = await AsyncStorage.getItem('tattvam_favorites');
      let favArray = existingFavs ? JSON.parse(existingFavs) : [];
      if (isFavorite) {
        favArray = favArray.filter(item => item.barcode !== p.barcode);
        setIsFavorite(false);
      } else {
        favArray.unshift(p);
        setIsFavorite(true);
      }
      await AsyncStorage.setItem('tattvam_favorites', JSON.stringify(favArray));
    } catch (e) {}
  };

  // ✅ FIXED: Bulletproof logic for Suggestions
  const currentScore = p?.nutriScore ? String(p.nutriScore).toUpperCase().trim() : '?';
  const needsHealthier = ['C', 'D', 'E', '?'].includes(currentScore);

  useEffect(() => {
    if (needsHealthier) {
      setLoadingAlts(true);
      fetch('https://tattvam-app.onrender.com/api/products/alternatives')
        .then(res => res.json())
        .then(data => {
          setAlternatives(data.filter(item => item.barcode !== p?.barcode));
          setLoadingAlts(false);
        }).catch(() => setLoadingAlts(false));
    } else {
      setLoadingAlts(false); 
    }
  }, [p, needsHealthier]);

  // AI CHAT LOGIC
  const handleAskAI = async () => {
    const userMessage = aiQuestion.trim();
    if (!userMessage) return;

    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setAiQuestion("");
    setAiLoading(true);

    try {
      const prefsStr = await AsyncStorage.getItem('tattvam_prefs');
      let aiMode = 'Strict Dietitian'; 
      if (prefsStr) {
        const prefs = JSON.parse(prefsStr);
        if (prefs.aiMode) aiMode = prefs.aiMode;
      }

      let personaString = "";
      if (aiMode === 'Gym Bro') personaString = "Reply like a strict Gym Bro focusing on muscle, protein, and macros. Don't be too polite. Keep it short. ";
      else if (aiMode === 'Casual') personaString = "Reply casually, friendly, and positively. Keep it short. ";
      else personaString = "Reply like a strict, highly scientific Dietitian. Keep it short. ";

      const finalQuestion = personaString + "Product: " + p?.name + ". Question: " + userMessage;

      const res = await fetch(`https://tattvam-app.onrender.com/api/products/${p.barcode}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: finalQuestion })
      });
      
      const data = await res.json();
      
      if (data.answer) {
        setChatHistory(prev => [...prev, { role: 'ai', text: data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'ai', text: "Oops, backend se response nahi aaya." }]);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Connection error. Please check your internet or local server." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const getScoreColor = (score) => {
    const colors = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', E: '#ef4444', '?': '#94a3b8' };
    return colors[score] || '#94a3b8';
  };

  const finalImageUri = p?.imageUrl || p?.image || p?.img || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="chevron-left" size={18} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.likeBtn} onPress={toggleFavorite}>
          <FontAwesome5 name="heart" size={22} color={isFavorite ? "#ef4444" : "#cbd5e1"} solid={isFavorite} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {detectedAllergies.length > 0 && (
          <View style={styles.allergyAlertBox}>
            <View style={styles.allergyHeader}>
              <View style={styles.skullCircle}>
                <FontAwesome5 name="skull-crossbones" size={16} color="white" />
              </View>
              <Text style={styles.allergyTitle}>ALLERGY WARNING</Text>
            </View>
            <Text style={styles.allergyText}>
              This product contains hidden ingredients related to your saved allergies: <Text style={styles.allergyHighlight}>{detectedAllergies.join(', ')}</Text>.
            </Text>
          </View>
        )}

        <View style={styles.mainCard}>
          <View style={styles.cardTop}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: finalImageUri }} style={styles.image} resizeMode="contain" />
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.brand}>{p?.brand || "UNKNOWN BRAND"}</Text>
              <Text style={styles.name} numberOfLines={2}>{p?.name}</Text>
              
              <View style={styles.scoreRow}>
                <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(currentScore) }]}>
                  <Text style={styles.scoreText}>{currentScore}</Text>
                </View>
                <View>
                  <Text style={styles.scoreLabel}>Nutri-Score Grade</Text>
                  <Text style={styles.scoreSubLabel}>{currentScore === 'A' || currentScore === 'B' ? 'Good Choice' : currentScore === 'C' ? 'Moderate' : 'Unhealthy'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.aiButton} onPress={() => setAiModalVisible(true)} activeOpacity={0.8}>
          <View style={styles.aiIconWrapper}>
            <FontAwesome5 name="robot" size={18} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiButtonTitle}>Ask Tattvam AI ✨</Text>
            <Text style={styles.aiButtonSub}>Chat with your health assistant</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="white" opacity={0.7} />
        </TouchableOpacity>

        {warnings.length > 0 && (
          <View style={styles.warningBox}>
            <View style={styles.warningHeader}>
              <FontAwesome5 name="exclamation-triangle" size={16} color="#dc2626" />
              <Text style={styles.warningTitle}>Health Warnings</Text>
            </View>
            {warnings.map((w, index) => <Text key={index} style={styles.warningText}>• {w}</Text>)}
          </View>
        )}

        <Text style={styles.sectionTitle}>Nutritional Value (per 100g)</Text>
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fff7ed' }]}>
              <FontAwesome5 name="fire" size={16} color="#ea580c" />
            </View>
            <Text style={[styles.gridValue, {color: '#ea580c'}]}>{nutrition.calories}</Text>
            <Text style={styles.gridLabel}>Kcal</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#eff6ff' }]}>
              <FontAwesome5 name="dumbbell" size={14} color="#3b82f6" />
            </View>
            <Text style={[styles.gridValue, {color: '#3b82f6'}]}>{nutrition.protein}g</Text>
            <Text style={styles.gridLabel}>Protein</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fdf4ff' }]}>
              <FontAwesome5 name="bread-slice" size={14} color="#8b5cf6" />
            </View>
            <Text style={[styles.gridValue, {color: '#8b5cf6'}]}>{nutrition.carbs}g</Text>
            <Text style={styles.gridLabel}>Carbs</Text>
          </View>
          <View style={styles.gridItem}>
            <View style={[styles.iconWrapper, { backgroundColor: '#fef2f2' }]}>
              <FontAwesome5 name="tint" size={16} color="#e11d48" />
            </View>
            <Text style={[styles.gridValue, {color: '#e11d48'}]}>{nutrition.fat}g</Text>
            <Text style={styles.gridLabel}>Fat</Text>
          </View>
        </View>

        <View style={styles.ingredientsCard}>
          <View style={styles.ingredientsHeaderRow}>
            <Text style={styles.sectionTitle}>Ingredients Breakdown</Text>
            <Text style={styles.ingredientsCount}>{cleanIngredients.length} Items</Text>
          </View>
          
          <View style={styles.ingredientsWrapper}>
            {cleanIngredients.length > 0 ? cleanIngredients.map((ing, index) => {
              if (ing.length <= 2) return null; 
              
              // ✅ FIXED: Smart Frontend Filtering combined with Backend List
              const lowerIng = ing.toLowerCase();
              const isBadBackend = backendBadIngredients.some(bad => lowerIng.includes(bad.toLowerCase()));
              const isBadFrontend = DANGEROUS_INGREDIENTS.some(bad => lowerIng.includes(bad));
              const isBad = isBadBackend || isBadFrontend;

              return (
                <View key={index} style={[styles.pill, isBad ? styles.badPill : styles.goodPill]}>
                  <FontAwesome5 name={isBad ? "exclamation-circle" : "check-circle"} size={12} color={isBad ? "#dc2626" : "#16a34a"} style={{ marginRight: 6 }} />
                  <Text style={[styles.pillText, isBad ? styles.badPillText : styles.goodPillText]}>{ing}</Text>
                </View>
              );
            }) : <Text style={styles.noDataText}>Detailed ingredients not available.</Text>}
          </View>
        </View>

        {/* ✅ FIXED: Healthier Options will now reliably show up if score is C, D, E, or ? */}
        {needsHealthier && (
          <View style={styles.alternativesSection}>
            <View style={styles.altHeaderRow}>
              <Text style={styles.sectionTitle}>Try Healthier Options</Text>
              <FontAwesome5 name="leaf" size={16} color="#16a34a" />
            </View>
            
            {loadingAlts ? <ActivityIndicator color="#00C897" style={{ marginTop: 20 }} /> : alternatives.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                {alternatives.map((alt, idx) => {
                  const altImg = alt.imageUrl || alt.image || alt.img || "https://placehold.co/200/cccccc/ffffff?text=No+Image";
                  return (
                    <TouchableOpacity key={idx} style={styles.altCard} onPress={() => navigation.push('ProductDetail', { product: alt })}>
                      <View style={styles.altImageContainer}>
                        <Image source={{ uri: altImg }} style={styles.altImage} resizeMode="contain" />
                        <View style={[styles.altBadge, { backgroundColor: getScoreColor(alt.nutriScore) }]}>
                          <Text style={styles.altBadgeText}>{alt.nutriScore}</Text>
                        </View>
                      </View>
                      <View style={styles.altTextContainer}>
                        <Text style={styles.altName} numberOfLines={2}>{alt.name}</Text>
                        <Text style={styles.altBrand} numberOfLines={1}>{alt.brand}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : <Text style={styles.noDataText}>No healthier alternatives found right now.</Text>}
          </View>
        )}

      </ScrollView>

      {/* 🤖 THE NEW CHATBOT MODAL */}
      <Modal animationType="slide" transparent={true} visible={aiModalVisible} onRequestClose={() => setAiModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={styles.chatModalContent}>
            
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatAvatar}>
                  <FontAwesome5 name="robot" size={16} color="white" />
                </View>
                <View>
                  <Text style={styles.chatTitle}>Tattvam AI</Text>
                  <Text style={styles.chatSubTitle}>Online • {p?.name}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setAiModalVisible(false)} style={styles.closeChatBtn}>
                <FontAwesome5 name="times" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages Area */}
            <ScrollView 
              style={styles.chatArea} 
              showsVerticalScrollIndicator={false}
              ref={scrollViewRef}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {chatHistory.length === 0 ? (
                <View style={styles.aiWelcomeBox}>
                  <FontAwesome5 name="magic" size={30} color="#c7d2fe" style={{ marginBottom: 15 }} />
                  <Text style={styles.aiWelcomeText}>Hi! I'm Tattvam AI.</Text>
                  <Text style={styles.aiWelcomeSub}>Ask me anything about {p?.name}. For example: "Is this safe for diabetics?"</Text>
                </View>
              ) : (
                chatHistory.map((msg, idx) => (
                  <View key={idx} style={msg.role === 'user' ? styles.userBubbleWrapper : styles.aiBubbleWrapper}>
                    {msg.role === 'ai' && <FontAwesome5 name="robot" size={14} color="#6366f1" style={{ marginRight: 8, marginTop: 10 }} />}
                    <View style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
                      <Text style={msg.role === 'user' ? styles.userText : styles.aiText}>{msg.text}</Text>
                    </View>
                  </View>
                ))
              )}
              
              {/* Typing Indicator */}
              {aiLoading && (
                <View style={styles.aiBubbleWrapper}>
                  <FontAwesome5 name="robot" size={14} color="#6366f1" style={{ marginRight: 8, marginTop: 10 }} />
                  <View style={[styles.aiBubble, { paddingHorizontal: 15, paddingVertical: 12 }]}>
                    <ActivityIndicator size="small" color="#6366f1" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.chatInputContainer}>
              <TextInput 
                style={styles.chatInput} 
                placeholder="Message Tattvam AI..." 
                placeholderTextColor="#94a3b8"
                value={aiQuestion} 
                onChangeText={setAiQuestion} 
                multiline
                maxLength={150}
              />
              <TouchableOpacity 
                style={[styles.chatSendBtn, !aiQuestion.trim() && { backgroundColor: '#e2e8f0' }]} 
                onPress={handleAskAI} 
                disabled={aiLoading || !aiQuestion.trim()}
              >
                <FontAwesome5 name="paper-plane" size={16} color={aiQuestion.trim() ? "white" : "#94a3b8"} />
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  likeBtn: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  content: { backgroundColor: '#F8FAFC', padding: 20 },
  
  allergyAlertBox: { backgroundColor: '#7f1d1d', padding: 20, borderRadius: 20, marginBottom: 20, shadowColor: '#7f1d1d', shadowOpacity: 0.5, shadowRadius: 15, elevation: 8 },
  allergyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  skullCircle: { width: 30, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  allergyTitle: { color: 'white', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  allergyText: { color: '#fca5a5', fontSize: 14, lineHeight: 22 },
  allergyHighlight: { color: 'white', fontWeight: 'bold', textTransform: 'uppercase' },

  mainCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9' },
  cardTop: { flexDirection: 'row', gap: 15, alignItems: 'center' },
  imageContainer: { width: 100, height: 100, backgroundColor: '#f8fafc', borderRadius: 20, padding: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  image: { width: '100%', height: '100%' },
  infoContainer: { flex: 1 },
  brand: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  name: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 12, lineHeight: 24 },
  
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreBadge: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 2 },
  scoreText: { color: 'white', fontWeight: '900', fontSize: 20 },
  scoreLabel: { fontSize: 12, color: '#334155', fontWeight: 'bold' },
  scoreSubLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '600' },

  aiButton: { flexDirection: 'row', backgroundColor: '#4f46e5', padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 25, shadowColor: '#4f46e5', shadowOpacity: 0.3, shadowRadius: 15, elevation: 6 },
  aiIconWrapper: { width: 36, height: 36, backgroundColor: 'white', borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  aiButtonTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  aiButtonSub: { color: '#c7d2fe', fontSize: 12 },

  warningBox: { backgroundColor: '#fef2f2', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#fecaca', marginBottom: 25 },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  warningTitle: { color: '#b91c1c', fontWeight: '900', fontSize: 15 },
  warningText: { color: '#dc2626', fontSize: 13, marginLeft: 5, marginBottom: 4, lineHeight: 20, fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 15 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 30 },
  gridItem: { flex: 1, minWidth: '22%', backgroundColor: 'white', padding: 15, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 1, borderWidth: 1, borderColor: '#f1f5f9' },
  iconWrapper: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  gridValue: { fontSize: 18, fontWeight: '900', marginBottom: 2 },
  gridLabel: { fontSize: 11, color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' },

  ingredientsCard: { backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 30, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9' },
  ingredientsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  ingredientsCount: { backgroundColor: '#f1f5f9', color: '#475569', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  ingredientsWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  pillText: { fontSize: 13, fontWeight: '700' },
  goodPill: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  goodPillText: { color: '#15803d' },
  badPill: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  badPillText: { color: '#b91c1c' },
  noDataText: { color: '#94a3b8', fontStyle: 'italic', fontSize: 13 },

  alternativesSection: { marginBottom: 20 },
  altHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  altCard: { width: 140, backgroundColor: 'white', borderRadius: 20, marginRight: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  altImageContainer: { width: '100%', height: 100, backgroundColor: '#f8fafc', padding: 15, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  altImage: { width: '100%', height: '100%' },
  altBadge: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  altBadgeText: { color: 'white', fontSize: 12, fontWeight: '900' },
  altTextContainer: { padding: 12 },
  altName: { fontSize: 13, fontWeight: 'bold', color: '#1e293b', marginBottom: 4, lineHeight: 18 },
  altBrand: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' },

  // ================== CHAT UI STYLES ==================
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  chatModalContent: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '85%', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, overflow: 'hidden' },
  
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', zIndex: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  chatAvatar: { width: 40, height: 40, backgroundColor: '#6366f1', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  chatTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  chatSubTitle: { fontSize: 12, color: '#10b981', fontWeight: '600' },
  closeChatBtn: { padding: 5 },
  
  chatArea: { flex: 1, paddingHorizontal: 15, paddingVertical: 20 },
  
  aiWelcomeBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  aiWelcomeText: { fontSize: 20, fontWeight: 'bold', color: '#334155', marginBottom: 8 },
  aiWelcomeSub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

  userBubbleWrapper: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 15 },
  userBubble: { backgroundColor: '#6366f1', padding: 15, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '80%' },
  userText: { color: 'white', fontSize: 15, lineHeight: 22 },

  aiBubbleWrapper: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 15, maxWidth: '90%' },
  aiBubble: { backgroundColor: 'white', padding: 15, borderRadius: 20, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  aiText: { color: '#334155', fontSize: 15, lineHeight: 24 },

  chatInputContainer: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'white', padding: 15, paddingBottom: Platform.OS === 'ios' ? 30 : 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  chatInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, fontSize: 15, color: '#1e293b', maxHeight: 100 },
  chatSendBtn: { width: 48, height: 48, backgroundColor: '#6366f1', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 10, shadowColor: '#6366f1', shadowOpacity: 0.3, shadowRadius: 5, elevation: 4 }
});