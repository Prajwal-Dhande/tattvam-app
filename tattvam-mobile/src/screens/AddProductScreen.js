import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AddProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Barcode will automatically populate from the scanner screen
  const initialBarcode = route.params?.barcode || '';

  const [barcode, setBarcode] = useState(initialBarcode);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !barcode.trim()) {
      Alert.alert('Incomplete', 'Please provide both the Product Name and Barcode.');
      return;
    }

    setLoading(true);
    try {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
      const token = userInfo?.token || '';

      const res = await fetch('https://tattvam-app.onrender.com/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim(),
          barcode: barcode.trim()
        })
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(
          'Success! 🎉', 
          'The product has been successfully added to the database (Pending Approval). The Tattvam team will update its NutriScore shortly!',
          // ✅ FIX: Correct Nested Navigation Path
          [{ text: 'Awesome', onPress: () => navigation.navigate('MainTabs', { screen: 'Home' }) }]
        );
      } else {
        Alert.alert('Error', data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Unable to connect to the server. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header (Kept outside KeyboardAvoidingView so it stays fixed at top) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <FontAwesome5 name="arrow-left" size={20} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Product</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ✅ FIXED: Added ScrollView inside KeyboardAvoidingView */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Important: Allows tapping outside to close keyboard
        >
          <View style={styles.iconWrapper}>
            <FontAwesome5 name="box-open" size={50} color="#00C897" />
          </View>
          <Text style={styles.title}>Help the Community!</Text>
          <Text style={styles.subtitle}>This product is not yet in the Tattvam database. Add its details to help others.</Text>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.label}>Barcode Number</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="barcode" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={barcode} 
                onChangeText={setBarcode}
                keyboardType="numeric"
                placeholder="e.g. 8901058002364"
                editable={!initialBarcode} // Prevent editing if the barcode was scanned
              />
            </View>

            <Text style={styles.label}>Product Name <Text style={{color: 'red'}}>*</Text></Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="tag" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName}
                placeholder="e.g. Maggi 2-Minute Noodles"
              />
            </View>

            <Text style={styles.label}>Brand Name</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="building" size={16} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={brand} 
                onChangeText={setBrand}
                placeholder="e.g. Nestle"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <FontAwesome5 name="cloud-upload-alt" size={18} color="white" style={{ marginRight: 10 }} />
                <Text style={styles.submitBtnText}>Submit Product</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Added some padding at bottom so scroll reaches slightly above keyboard */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, backgroundColor: 'white', zIndex: 10 },
  backBtn: { width: 40, height: 40, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  scrollContent: { padding: 20, paddingBottom: 40 }, // Changed container to scrollContent
  
  iconWrapper: { alignSelf: 'center', width: 100, height: 100, backgroundColor: '#e0f8f1', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 30, paddingHorizontal: 10, lineHeight: 22 },

  formCard: { backgroundColor: 'white', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 30 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, paddingHorizontal: 15, height: 55 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1e293b' },

  submitBtn: { flexDirection: 'row', backgroundColor: '#00C897', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#00C897', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});