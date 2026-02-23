import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated, Easing, Alert 
} from 'react-native';
import { CameraView, Camera } from 'expo-camera'; 
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  
  // Manual Entry States
  const [manualModal, setManualModal] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const isFocused = useIsFocused(); 

  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // ✅ FIX: Laser ab kabhi freeze nahi hoga! Proper reset logic lagaya hai
  useEffect(() => {
    // Laser tabhi chalegi jab focus ho, scan na hua ho, loading na ho, aur modal band ho
    if (isFocused && !scanned && !loading && !manualModal) {
      laserAnim.setValue(0); // Pehle reset karo taaki atak ke na reh jaye
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 240, 
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0, 
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [isFocused, scanned, loading, manualModal, laserAnim]);

  const fetchProductData = async (barcode) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nonpapistical-prohibitively-dulcie.ngrok-free.dev/api/products/${barcode}`);
      const data = await res.json();
      
      setLoading(false);
      setManualModal(false); 
      setManualBarcode(''); 
      
      if (res.ok) {
        navigation.navigate('ProductDetail', { product: data });
      } else {
        // ✅ NEW: Navigate to AddProduct if not found
        Alert.alert(
          "Product Not Found 🕵️‍♂️", 
          "Yeh product humare database mein nahi hai. Kya aap isko add karna chahenge?",
          [
            { text: "Cancel", style: "cancel", onPress: () => setScanned(false) },
            { 
              text: "Add Product", 
              onPress: () => {
                setScanned(false);
                navigation.navigate('AddProduct', { barcode: barcode }); 
              } 
            }
          ]
        );
      }
    } catch (error) {
      setLoading(false);
      // ✅ FIX: Proper Alert use kiya, aur 'OK' dabane ke BAAD rescan allow kiya
      Alert.alert(
        "Connection Error", 
        "Server se connect nahi ho paya. IP address ya backend check karo.",
        [{ text: "OK", onPress: () => setScanned(false) }] // Dismiss hone par hi scan wapas on hoga
      );
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    fetchProductData(data);
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim().length < 3) {
      Alert.alert("Invalid", "Enter a valid barcode!");
      return;
    }
    fetchProductData(manualBarcode.trim());
  };

  if (hasPermission === null) return <View style={styles.container}><ActivityIndicator color="#00C897" /></View>;
  if (hasPermission === false) return <Text style={{ marginTop: 50, textAlign: 'center', color: 'white' }}>No access to camera</Text>;

  return (
    <View style={styles.container}>
      {isFocused && (
        <CameraView 
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned || manualModal ? undefined : handleBarCodeScanned}
          enableTorch={flashlight}
        />
      )}

      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.scanText}>Scan Barcode</Text>
          <Text style={styles.scanSubText}>Center the barcode within the frame</Text>
        </View>
        
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scannerFrame}>
            
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {!scanned && !loading && !manualModal && (
               <Animated.View style={[styles.laser, { transform: [{ translateY: laserAnim }] }]} />
            )}
            
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C897" />
                <Text style={styles.loadingText}>Analyzing...</Text>
              </View>
            )}
          </View>
          <View style={styles.sideOverlay} />
        </View>
        
        <View style={styles.bottomOverlay}>
          {scanned && !loading && (
            <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
              <FontAwesome5 name="redo-alt" size={16} color="white" style={{marginRight: 8}} />
              <Text style={styles.rescanText}>Scan Again</Text>
            </TouchableOpacity>
          )}

          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.iconButton, flashlight && styles.iconButtonActive]} 
              onPress={() => setFlashlight(!flashlight)}
            >
              <FontAwesome5 name={flashlight ? "bolt" : "bolt"} size={20} color={flashlight ? "#fbbf24" : "white"} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.manualBtn} onPress={() => setManualModal(true)}>
              <FontAwesome5 name="keyboard" size={16} color="white" style={{ marginRight: 10 }} />
              <Text style={styles.manualBtnText}>Type Barcode</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MANUAL ENTRY MODAL */}
      <Modal visible={manualModal} transparent animationType="fade" onRequestClose={() => setManualModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Entry</Text>
              <TouchableOpacity onPress={() => setManualModal(false)} style={styles.closeBtn}>
                <FontAwesome5 name="times" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Enter the numbers below the barcode</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. 8901063012530"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              autoFocus={true}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleManualSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Analyze Product</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  
  overlay: { flex: 1, position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  bottomOverlay: { flex: 1.5, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', paddingTop: 40 },
  middleRow: { flexDirection: 'row', height: 260 },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  
  scanText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  scanSubText: { color: '#cbd5e1', fontSize: 14 },
  
  scannerFrame: { width: 260, height: 260, backgroundColor: 'transparent', overflow: 'hidden' },
  corner: { position: 'absolute', width: 50, height: 50, borderColor: '#00C897', borderWidth: 5 },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 20 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 20 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 20 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 20 },
  
  laser: { width: '100%', height: 3, backgroundColor: '#00C897', shadowColor: '#00C897', shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16 },
  loadingText: { color: '#00C897', marginTop: 10, fontWeight: 'bold' },

  rescanBtn: { flexDirection: 'row', backgroundColor: '#0f172a', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
  rescanText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  controlsContainer: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 20 },
  iconButton: { width: 55, height: 55, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  iconButtonActive: { backgroundColor: 'rgba(251, 191, 36, 0.2)', borderWidth: 1, borderColor: '#fbbf24' },
  
  manualBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 16, paddingHorizontal: 25, borderRadius: 30, alignItems: 'center' },
  manualBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  closeBtn: { padding: 5, backgroundColor: '#f1f5f9', borderRadius: 15 },
  modalSub: { color: '#64748b', fontSize: 14, marginBottom: 20 },
  input: { backgroundColor: '#f8fafc', padding: 18, borderRadius: 16, fontSize: 18, color: '#0f172a', marginBottom: 20, letterSpacing: 3, textAlign: 'center', fontWeight: '900', borderWidth: 1, borderColor: '#e2e8f0' },
  submitBtn: { backgroundColor: '#00C897', padding: 18, borderRadius: 16, alignItems: 'center', shadowColor: '#00C897', shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});