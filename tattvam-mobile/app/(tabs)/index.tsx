import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 10 }}>Camera permission needed!</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    alert(`Barcode found: ${data}\nAbhi hum isko tere Render backend se connect karenge!`);
    // Idhar hum fetchApi(`/products/${data}`) call karenge next step mein
    setTimeout(() => setScanned(false), 3000); 
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            <View style={styles.laser} />
          </View>
          <View style={styles.unfocusedContainer}>
             <Text style={styles.infoText}>Align barcode within the frame</Text>
          </View>
        </View>
      </CameraView>

      {scanned && (
        <TouchableOpacity style={styles.scanAgainBtn} onPress={() => setScanned(false)}>
          <Text style={styles.buttonText}>Tap to Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  unfocusedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  focusedContainer: {
    width: 280,
    height: 200,
    borderWidth: 2,
    borderColor: '#00C897',
    backgroundColor: 'transparent',
    borderRadius: 20,
    overflow: 'hidden'
  },
  laser: {
    height: 2,
    backgroundColor: '#00C897',
    width: '100%',
    position: 'absolute',
    shadowColor: '#00C897',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  infoText: { color: '#fff', marginTop: 20, fontWeight: 'bold' },
  button: { backgroundColor: '#00C897', padding: 15, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  scanAgainBtn: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: '#00C897',
    padding: 15,
    borderRadius: 30,
    elevation: 5
  }
});