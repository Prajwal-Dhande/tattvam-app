import { Tabs } from 'expo-router';
import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00C897', // Tera Tattvam wala green color
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: true,
        headerTitleStyle: { fontWeight: 'bold', color: '#0f172a' },
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 5,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0'
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          headerTitle: 'Tattvam Scanner',
          tabBarIcon: ({ color }) => <FontAwesome5 name="qrcode" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <FontAwesome5 name="history" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <FontAwesome5 name="compass" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <FontAwesome5 name="chart-line" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}