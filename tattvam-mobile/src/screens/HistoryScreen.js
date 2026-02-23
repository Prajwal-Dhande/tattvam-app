import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, Platform 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Jab bhi History tab khule, data refresh hoga
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    setLoading(true);
    try {
      const savedHistory = await AsyncStorage.getItem('tattvam_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      "Clear All History?",
      "Are you sure you want to delete all your scanned items?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Delete", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('tattvam_history');
            setHistory([]);
          }
        }
      ]
    );
  };

  // ✅ NAYA FEATURE: Single Item Delete
  const deleteSingleItem = async (barcode) => {
    try {
      const newHistory = history.filter(item => item.barcode !== barcode);
      setHistory(newHistory);
      await AsyncStorage.setItem('tattvam_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error("Error deleting item", error);
    }
  };

  const getScoreColor = (score) => {
    const colors = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', E: '#ef4444', '?': '#94a3b8' };
    return colors[score] || '#94a3b8';
  };

  const renderHistoryItem = ({ item }) => {
    const imgUri = item.imageUrl || item.image || item.img || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80";
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imgUri }} style={styles.image} resizeMode="contain" />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.brand} numberOfLines={1}>{item.brand || 'UNKNOWN'}</Text>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          
          <View style={styles.bottomRow}>
            <View style={styles.barcodeRow}>
              <FontAwesome5 name="barcode" size={10} color="#94a3b8" />
              <Text style={styles.barcodeText}>{item.barcode}</Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(item.nutriScore) }]}>
              <Text style={styles.scoreText}>{item.nutriScore || '?'}</Text>
            </View>
          </View>
        </View>

        {/* Delete Single Item Button */}
        <TouchableOpacity 
          style={styles.deleteItemBtn} 
          onPress={() => deleteSingleItem(item.barcode)}
        >
          <FontAwesome5 name="times" size={14} color="#cbd5e1" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Scan History</Text>
          <Text style={styles.headerSub}>Your past analysis</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearBtn}>
            <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT */}
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#00C897" style={{ marginTop: 50 }} />
        ) : history.length > 0 ? (
          <FlatList
            data={history}
            keyExtractor={(item, index) => `${item.barcode}-${index}`}
            renderItem={renderHistoryItem}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <FontAwesome5 name="search" size={50} color="#94a3b8" />
            </View>
            <Text style={styles.emptyText}>Nothing here yet!</Text>
            <Text style={styles.emptySubText}>You haven't scanned or searched any products. Start exploring healthy options now.</Text>
            
            <TouchableOpacity 
              style={styles.scanNowBtn} 
              onPress={() => navigation.navigate('Scan')}
            >
              <FontAwesome5 name="barcode" size={16} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.scanNowText}>Scan a Product</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  headerSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  clearBtn: { width: 44, height: 44, backgroundColor: '#fef2f2', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },

  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20 },

  // Card Design
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, marginBottom: 15, padding: 15, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 3, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center' },
  imageContainer: { width: 75, height: 75, backgroundColor: '#f8fafc', borderRadius: 16, justifyContent: 'center', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  image: { width: '100%', height: '100%' },
  
  infoContainer: { flex: 1, marginLeft: 15, justifyContent: 'center', paddingRight: 10 },
  brand: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2, letterSpacing: 0.5 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 10, lineHeight: 20 },
  
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  barcodeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  barcodeText: { fontSize: 11, color: '#64748b', marginLeft: 6, fontWeight: '600', letterSpacing: 0.5 },
  
  scoreBadge: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  scoreText: { color: 'white', fontSize: 14, fontWeight: '900' },

  deleteItemBtn: { position: 'absolute', top: 15, right: 15, padding: 5 },

  // Empty State Styles
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, marginTop: -50 },
  emptyIconWrapper: { width: 120, height: 120, backgroundColor: '#f1f5f9', borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  emptyText: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
  emptySubText: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 35, lineHeight: 24 },
  scanNowBtn: { flexDirection: 'row', backgroundColor: '#0f172a', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  scanNowText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});