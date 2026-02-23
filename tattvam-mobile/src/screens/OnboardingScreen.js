import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Dimensions, SafeAreaView, Platform 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Scan Any Product',
    description: 'Instantly reveal hidden ingredients and nutritional values just by scanning the barcode.',
    icon: 'barcode',
    color: '#00C897'
  },
  {
    id: '2',
    title: 'Tattvam AI Analysis',
    description: 'Our advanced AI breaks down complex ingredients into simple, easy-to-understand health grades.',
    icon: 'robot',
    color: '#6366f1'
  },
  {
    id: '3',
    title: 'Make Healthier Choices',
    description: 'Discover better alternatives and start your journey towards a healthier lifestyle today.',
    icon: 'heartbeat',
    color: '#ef4444'
  }
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const completeOnboarding = async () => {
    try {
      // User ne onboarding dekh li hai, ye save kar lo
      await AsyncStorage.setItem('hasOnboarded', 'true');
      navigation.replace('Login'); // Uske baad direct login pe bhejo
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
  };

  const scrollToNext = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.iconCircle, { backgroundColor: `${item.color}15` }]}>
          <FontAwesome5 name={item.icon} size={80} color={item.color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.skipRow}>
        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={completeOnboarding}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={slides}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.indicator, 
                currentIndex === index ? styles.indicatorActive : null
              ]} 
            />
          ))}
        </View>

        {/* Next/Start Button */}
        <TouchableOpacity style={styles.button} onPress={scrollToNext} activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
          <FontAwesome5 
            name={currentIndex === slides.length - 1 ? "check" : "arrow-right"} 
            size={16} 
            color="white" 
            style={{ marginLeft: 8 }} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 25, paddingTop: Platform.OS === 'android' ? 40 : 20, height: 80 },
  skipText: { fontSize: 16, fontWeight: 'bold', color: '#94a3b8' },
  
  slide: { width, alignItems: 'center', paddingHorizontal: 30, paddingTop: 40 },
  iconCircle: { width: 220, height: 220, borderRadius: 110, justifyContent: 'center', alignItems: 'center', marginBottom: 50 },
  
  textContainer: { alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, paddingHorizontal: 10 },

  bottomContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30, height: 100 },
  indicatorContainer: { flexDirection: 'row', alignItems: 'center' },
  indicator: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  indicatorActive: { width: 20, backgroundColor: '#00C897' }, // Lamba wala active dot
  
  button: { flexDirection: 'row', backgroundColor: '#00C897', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 25, alignItems: 'center', shadowColor: '#00C897', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});