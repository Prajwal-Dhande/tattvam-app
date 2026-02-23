import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function NotificationsScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.notifCard}>
          <View style={[styles.iconBox, { backgroundColor: '#e0f8f1' }]}>
            <FontAwesome5 name="robot" size={18} color="#00C897" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to Tattvam AI!</Text>
            <Text style={styles.desc}>Start scanning barcodes to uncover hidden ingredients in your food.</Text>
            <Text style={styles.time}>Just now</Text>
          </View>
        </View>

        <View style={styles.notifCard}>
          <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
            <FontAwesome5 name="cog" size={18} color="#ea580c" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Set your Health Goals</Text>
            <Text style={styles.desc}>Head over to the settings to select your AI Coach strictness and allergies.</Text>
            <Text style={styles.time}>1 hour ago</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  notifCard: { flexDirection: 'row', backgroundColor: 'white', padding: 18, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  time: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' }
});