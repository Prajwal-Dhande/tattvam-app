import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FontAwesome5 } from '@expo/vector-icons';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

// Saari screens import karo
import HomeScreen from '../screens/HomeScreen';
import ScannerScreen from '../screens/ScannerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen'; 
import LoginScreen from '../screens/LoginScreen';
import AddProductScreen from '../screens/AddProductScreen';
import OnboardingScreen from '../screens/OnboardingScreen'; // ✅ Nayi Onboarding Screen

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00C897',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { height: 65, paddingBottom: 10, paddingTop: 5 }
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({color}) => <FontAwesome5 name="home" size={20} color={color} /> }} />
      <Tab.Screen name="Scan" component={ScannerScreen} options={{ tabBarIcon: ({color}) => <FontAwesome5 name="camera" size={20} color={color} /> }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarIcon: ({color}) => <FontAwesome5 name="history" size={20} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({color}) => <FontAwesome5 name="user" size={20} color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    const checkAppStatus = async () => {
      try {
        // Dono cheezein ek sath check karo
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        const userInfo = await AsyncStorage.getItem('userInfo');

        if (!hasOnboarded) {
          // Naya user hai
          setInitialRoute('Onboarding');
        } else if (userInfo) {
          // Purana user hai jo login bhi hai
          setInitialRoute('MainTabs');
        } else {
          // Purana user hai par logout ho chuka hai
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error("Status check error:", error);
        setInitialRoute('Login');
      } finally {
        // Chota sa delay taaki splash screen feel aaye
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    checkAppStatus();
  }, []);

  // 🟢 FAKE SPLASH SCREEN (Pehli baar app khulte hi ye dikhega)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00C897' }}>
        <FontAwesome5 name="leaf" size={60} color="white" style={{ marginBottom: 20 }} />
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}