import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  SafeAreaView, Platform, Image, Dimensions, Alert, ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AnimatedCounter = ({ endValue, suffix = "", duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(endValue);
    if (start === end) return;
    
    const incrementTime = Math.abs(Math.floor(duration / end));
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [endValue, duration]);

  return <Text style={styles.statNumber}>{count}{suffix}</Text>;
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const dummyTrendingProducts = [
    { 
      barcode: "8901058002364", name: "Maggi Masala", brand: "NESTLE", nutriScore: "D", 
      image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&q=80",
      nutrition: { calories: 402, protein: 8, carbs: 59.6, fat: 14.4 }
    },
    { 
      barcode: "8904004400004", name: "Classic Salted Chips", brand: "LAYS", nutriScore: "E", 
      image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80",
      nutrition: { calories: 536, protein: 7, carbs: 52, fat: 34 }
    },
    { 
      barcode: "8901063012530", name: "Choco Cookies", brand: "BRITANNIA", nutriScore: "D", 
      image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80",
      nutrition: { calories: 508, protein: 6.7, carbs: 68, fat: 23 }
    }
  ];

  useEffect(() => {
    const fetchRealTrendingProducts = async () => {
      try {
        const res = await fetch('https://tattvam-app.onrender.com/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setTrendingProducts(data.reverse().slice(0, 5));
          else setTrendingProducts(dummyTrendingProducts);
        } else {
           setTrendingProducts(dummyTrendingProducts);
        }
      } catch (error) {
        setTrendingProducts(dummyTrendingProducts);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchRealTrendingProducts();
  }, []);

  useEffect(() => {
    const fetchLiveSuggestions = async () => {
      const query = searchQuery.trim();
      
      if (query.length === 0 || /^\d+$/.test(query)) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsSearching(true);
      setShowSuggestions(true);

      try {
        const res = await fetch(`https://tattvam-app.onrender.com/api/products/search?keyword=${query}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (error) {
        console.error("Live Search Error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchLiveSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleFullSearch = () => {
    const query = searchQuery.trim();
    if (!query) return;

    if (/^\d+$/.test(query)) {
      fetch(`https://tattvam-app.onrender.com/api/products/${query}`)
        .then(res => res.json())
        .then(data => {
          if(data.message) Alert.alert("Not Found", "Product not found in the database.");
          else navigation.navigate('ProductDetail', { product: data });
        })
        .catch(() => Alert.alert("Connection Error", "Unable to connect to the server. Please check your network."));
    } else {
      setShowSuggestions(false);
      navigation.navigate('SearchResults', { query: query });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        bounces={false}
        keyboardShouldPersistTaps="handled" 
      >
        
        <View style={[styles.headerContainer, { zIndex: 10 }]}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.subTitle}>Eat Smart, Live Better</Text>
              <Text style={styles.brandTitle}>Tattvam</Text>
            </View>
            {/* ✅ FIXED: Replaced alert with actual Navigation */}
            <TouchableOpacity 
              style={styles.notificationBtn} 
              onPress={() => navigation.navigate('Notifications')}
            >
              <FontAwesome5 name="bell" size={24} color="white" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          <View style={{ zIndex: 20 }}>
            <View style={styles.searchRow}>
              <View style={styles.searchBarContainer}>
                <FontAwesome5 name="search" size={16} color="#94a3b8" style={{marginLeft: 15, marginRight: 5}} />
                <TextInput 
                  style={styles.searchInput} 
                  placeholder="Search products..." 
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleFullSearch} 
                  returnKeyType="search"
                  onFocus={() => { if(searchQuery.trim().length > 0) setShowSuggestions(true); }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => { setSearchQuery(''); setShowSuggestions(false); }} 
                    style={{ padding: 10 }}
                  >
                    <FontAwesome5 name="times-circle" size={16} color="#cbd5e1" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity style={styles.searchBtnMini} onPress={handleFullSearch}>
                <FontAwesome5 name="arrow-right" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {showSuggestions && (
              <View style={styles.suggestionsDropdown}>
                {isSearching ? (
                  <ActivityIndicator size="small" color="#00C897" style={{ margin: 15 }} />
                ) : suggestions.length > 0 ? (
                  <View style={{ maxHeight: 250 }}>
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                      {suggestions.map((item, index) => {
                        const imgUri = item.imageUrl || item.image || item.img || "https://placehold.co/100/cccccc/ffffff?text=No+Image";
                        return (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.suggestionItem}
                            onPress={() => {
                              setShowSuggestions(false);
                              setSearchQuery(''); 
                              navigation.navigate('ProductDetail', { product: item });
                            }}
                          >
                            <Image source={{ uri: imgUri }} style={styles.suggestionImage} />
                            <View style={styles.suggestionTextContainer}>
                              <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                              <Text style={styles.suggestionBrand} numberOfLines={1}>{item.brand}</Text>
                            </View>
                            <FontAwesome5 name="arrow-up" size={12} color="#cbd5e1" style={{ transform: [{ rotate: '45deg' }] }} />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.noSuggestionText}>No matching products found.</Text>
                )}
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity activeOpacity={1} onPress={() => setShowSuggestions(false)} style={styles.contentContainer}>
          
          <View style={styles.trendingSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recently Scanned Globally</Text>
              <Text style={styles.trendingBadge}>Trending</Text>
            </View>
            
            {loadingTrending ? (
              <ActivityIndicator size="large" color="#00C897" style={{ marginTop: 20, marginBottom: 20 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingScroll}>
                {trendingProducts.map((item, index) => {
                  const finalImageUri = item.imageUrl || item.image || item.img || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80";
                  return (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.trendingCard} 
                      onPress={() => navigation.navigate('ProductDetail', { product: item })}
                    >
                      <View style={styles.trendingImageWrapper}>
                        <Image source={{ uri: finalImageUri }} style={styles.trendingImage} resizeMode="contain" />
                      </View>
                      <Text style={styles.trendingName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.trendingBrand} numberOfLines={1}>{item.brand || "UNKNOWN"}</Text>
                      <View style={styles.ratingRow}>
                        <FontAwesome5 name="star" size={10} color="#fbbf24" solid />
                        <Text style={styles.ratingText}>{item.nutriScore || "4.8"}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          <TouchableOpacity style={styles.heroBanner} onPress={() => navigation.navigate('Scan')} activeOpacity={0.9}>
            <View style={styles.heroContent}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroBadge}>NEW</Text>
                <Text style={styles.heroTitle}>What's really in your food?</Text>
                <Text style={styles.heroSubtitle}>Scan any barcode to reveal hidden ingredients instantly.</Text>
              </View>
              <View style={styles.heroImageWrapper}>
                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/2619/2619582.png" }} style={styles.heroImage} resizeMode="contain" />
              </View>
            </View>
            <View style={styles.heroButtonRow}>
              <Text style={styles.heroButtonText}>Start Scanning Now</Text>
              <FontAwesome5 name="arrow-right" size={16} color="white" />
            </View>
            <View style={styles.bgCircle1} />
            <View style={styles.bgCircle2} />
          </TouchableOpacity>

          <View style={styles.howItWorksSection}>
            <Text style={styles.howItWorksTitle}>How Tattvam Works</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: '#e0e7ff' }]}>
                  <FontAwesome5 name="barcode" size={24} color="#4f46e5" />
                </View>
                <Text style={styles.stepTitle}>Scan Product</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: '#dcfce3' }]}>
                  <FontAwesome5 name="search-plus" size={24} color="#16a34a" />
                </View>
                <Text style={styles.stepTitle}>Analyze Details</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: '#fee2e2' }]}>
                  <FontAwesome5 name="heartbeat" size={24} color="#ef4444" />
                </View>
                <Text style={styles.stepTitle}>Make Choice</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>TRUSTED BY FAMILIES IN INDIA</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <AnimatedCounter endValue={150} suffix="k+" duration={2000} />
                <Text style={styles.statLabel}>Products Analyzed</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statBox}>
                <AnimatedCounter endValue={50} suffix="k+" duration={2000} />
                <Text style={styles.statLabel}>Active Scanners</Text>
              </View>
            </View>
            <View style={styles.secureBadge}>
              <FontAwesome5 name="shield-alt" size={12} color="#00C897" />
              <Text style={styles.secureText}>100% Safe & AI Powered Platform</Text>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#00C897' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  headerContainer: { backgroundColor: '#00C897', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  subTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  brandTitle: { color: 'white', fontSize: 32, fontWeight: '900' },
  
  notificationBtn: { padding: 8, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 6, right: 8, width: 10, height: 10, backgroundColor: '#ef4444', borderRadius: 5, borderWidth: 2, borderColor: '#00C897' },
  
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16, height: 50, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 15, elevation: 4 },
  searchInput: { flex: 1, fontSize: 15, color: '#334155', height: '100%', paddingLeft: 5 },
  searchBtnMini: { backgroundColor: '#0f172a', width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },

  suggestionsDropdown: { 
    position: 'absolute', top: 55, left: 0, right: 62, backgroundColor: 'white', borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0'
  },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionImage: { width: 35, height: 35, borderRadius: 8, backgroundColor: '#f8fafc', marginRight: 12 },
  suggestionTextContainer: { flex: 1 },
  suggestionName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  suggestionBrand: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  noSuggestionText: { padding: 15, textAlign: 'center', color: '#64748b', fontSize: 13, fontStyle: 'italic' },

  contentContainer: { padding: 20, marginTop: -5 },

  trendingSection: { marginBottom: 25 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  trendingBadge: { backgroundColor: '#ccfbf1', color: '#0d9488', fontSize: 12, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  trendingScroll: { paddingBottom: 5 },
  trendingCard: { width: 140, backgroundColor: 'white', padding: 12, borderRadius: 16, marginRight: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  trendingImageWrapper: { width: '100%', height: 90, borderRadius: 12, marginBottom: 10, overflow: 'hidden', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  trendingImage: { width: '90%', height: '90%' },
  trendingName: { fontSize: 14, fontWeight: 'bold', color: '#334155', marginBottom: 2 },
  trendingBrand: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: '#64748b', fontWeight: '600' },

  heroBanner: { backgroundColor: '#0f172a', borderRadius: 24, padding: 25, marginBottom: 30, overflow: 'hidden', position: 'relative', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 6 },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heroTextContainer: { flex: 1, paddingRight: 10, zIndex: 2 },
  heroBadge: { backgroundColor: '#00C897', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, color: 'white', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  heroTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 8, lineHeight: 28 },
  heroSubtitle: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
  heroImageWrapper: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  heroImage: { width: '100%', height: '100%' },
  heroButtonRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 16, zIndex: 2 },
  heroButtonText: { color: 'white', fontWeight: 'bold', marginRight: 10 },
  bgCircle1: { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: '#00C897', opacity: 0.2 },
  bgCircle2: { position: 'absolute', bottom: -70, left: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: '#00C897', opacity: 0.1 },

  howItWorksSection: { marginBottom: 30 },
  howItWorksTitle: { fontSize: 20, fontWeight: 'bold', color: '#334155', textAlign: 'center', marginBottom: 20 },
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 10 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepIconBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  stepTitle: { fontSize: 13, fontWeight: 'bold', color: '#475569', textAlign: 'center' },

  statsSection: { backgroundColor: '#e0f8f1', borderRadius: 24, padding: 25, alignItems: 'center' },
  statsTitle: { fontSize: 13, fontWeight: 'bold', color: '#008560', letterSpacing: 1, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-evenly', width: '100%', alignItems: 'center', marginBottom: 20 },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 36, fontWeight: '900', color: '#0f172a', marginBottom: 5 },
  statLabel: { fontSize: 13, color: '#475569', fontWeight: '600' },
  divider: { width: 1, height: 40, backgroundColor: '#cbd5e1' },
  secureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 8 },
  secureText: { fontSize: 12, fontWeight: 'bold', color: '#00C897' }
});