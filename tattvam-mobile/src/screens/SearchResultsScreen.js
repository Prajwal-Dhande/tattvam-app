import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function SearchResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { query } = route.params; // The typed search query from HomeScreen is received here

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Performing a text search query directly against the production database
        const res = await fetch(`https://tattvam-app.onrender.com/api/products/search?keyword=${query}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search API Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query]);

  const renderItem = ({ item }) => {
    const finalImageUri = item.imageUrl || item.image || item.img || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80";
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: finalImageUri }} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.brand} numberOfLines={1}>{item.brand || 'UNKNOWN'}</Text>
          <View style={styles.ratingRow}>
             <FontAwesome5 name="star" size={12} color="#fbbf24" solid />
             <Text style={styles.ratingText}>{item.rating || "3.5"}</Text>
             <View style={styles.scoreBadge}>
               <Text style={styles.scoreText}>NutriScore: {item.nutriScore || 'N/A'}</Text>
             </View>
          </View>
        </View>
        <FontAwesome5 name="chevron-right" size={16} color="#cbd5e1" style={{ paddingRight: 10 }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.resultText}>Showing results for "{query}"</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#00C897" style={{ marginTop: 50 }} />
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="search" size={50} color="#cbd5e1" style={{ marginBottom: 20 }} />
            <Text style={styles.emptyText}>No products found for "{query}".</Text>
            <Text style={styles.emptySubText}>Use the scanner to add this product and help the community!</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#00C897' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, paddingBottom: 20, backgroundColor: '#00C897' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20 },
  resultText: { fontSize: 14, color: '#64748b', marginVertical: 15, fontWeight: '600' },
  
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 16, marginBottom: 15, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  imageContainer: { width: 70, height: 70, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginRight: 15 },
  image: { width: '100%', height: '100%' },
  infoContainer: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  brand: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginLeft: 4, marginRight: 15 },
  scoreBadge: { backgroundColor: '#e0f8f1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  scoreText: { color: '#00C897', fontSize: 10, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#475569', textAlign: 'center', marginBottom: 5 },
  emptySubText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' }
});