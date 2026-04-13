import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  SafeAreaView, Platform, Alert 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const WELCOME_NOTIF = {
  id: 'msg-welcome',
  title: 'Welcome to Tattvam AI!',
  body: 'Start scanning barcodes to uncover hidden ingredients in your food.',
  icon: 'robot',
  bgBox: '#e0f8f1',
  iconColor: '#00C897'
};

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState('');
  
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    loadNotifications();
    
    // ✅ REAL CODE: Generate actual token for APK
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log("🚀 REAL PUSH TOKEN FOR THIS DEVICE:", token);
        // Tu aage chalkar is token ko apne backend/database mein save kara sakta hai
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      saveLiveNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log("User tapped notification");
    });

    return () => {
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const saved = await AsyncStorage.getItem('tattvam_notifications');
      if (saved) {
        setNotifications(JSON.parse(saved));
      } else {
        const initialLoad = [{ ...WELCOME_NOTIF, date: new Date().toISOString() }];
        await AsyncStorage.setItem('tattvam_notifications', JSON.stringify(initialLoad));
        setNotifications(initialLoad);
      }
    } catch (error) { console.log("Load Notif Error", error); }
  };

  const saveLiveNotification = async (notification) => {
    try {
      const newNotif = {
        id: notification.request.identifier,
        title: notification.request.content.title || "Tattvam Alert",
        body: notification.request.content.body || "You have a new message.",
        date: new Date().toISOString(),
        icon: 'bell',        
        bgBox: '#e0e7ff',    
        iconColor: '#4f46e5' 
      };
      
      const saved = await AsyncStorage.getItem('tattvam_notifications');
      let notifsArray = saved ? JSON.parse(saved) : [];
      notifsArray.unshift(newNotif); 
      
      await AsyncStorage.setItem('tattvam_notifications', JSON.stringify(notifsArray));
      setNotifications(notifsArray);
    } catch (error) { console.log(error); }
  };

  const clearNotifications = () => {
    Alert.alert(
      "Clear All", 
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Delete", style: "destructive", onPress: async () => {
            await AsyncStorage.setItem('tattvam_notifications', JSON.stringify([]));
            setNotifications([]);
        }}
      ]
    );
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Today, ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      return `${dateStr}, ${timeStr}`;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.notifCard}>
      <View style={[styles.iconBox, { backgroundColor: item.bgBox || '#e0e7ff' }]}>
        <FontAwesome5 name={item.icon || 'bell'} size={18} color={item.iconColor || '#4f46e5'} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc}>{item.body}</Text>
        <Text style={styles.time}>{formatTime(item.date)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {/* ✅ REMOVED TEST BUTTON FOR PRODUCTION */}
        <TouchableOpacity style={styles.clearBtn} onPress={clearNotifications}>
          <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="bell-slash" size={40} color="#cbd5e1" style={{marginBottom: 15}}/>
          <Text style={styles.emptyText}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ✅ REAL SYSTEM FUNCTION FOR APK
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Getting the real token using EAS Project ID
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.log("⚠️ WARNING: EAS Project ID not found. Run 'eas init' before building APK.");
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }
    
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  
  clearBtn: { width: 40, height: 40, backgroundColor: '#fef2f2', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' },
  
  container: { padding: 20, paddingBottom: 100 },
  notifCard: { flexDirection: 'row', backgroundColor: 'white', padding: 18, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  textContainer: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  desc: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  time: { fontSize: 11, color: '#6366f1', fontWeight: 'bold' },

  emptyContainer: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' }
});