import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export default function NutritionSlider({ 
  icon, 
  title, 
  value, 
  unit, 
  percentage, 
  valueColor = "#1e293b", 
  scaleLabels = ['0', '25', '50', '75', '100', '>100'] 
}) {
  // Ensure pointer doesn't go outside the bar (cap at 100%)
  const pointerPosition = Math.min(Math.max(percentage, 0), 100);

  return (
    <View style={styles.container}>
      
      {/* 🟢 Header Row: Icon, Title & Value */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          {icon && <FontAwesome5 name={icon} size={16} color="#00C897" style={styles.icon} />}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={[styles.valueText, { color: valueColor }]}>
          {value} {unit}
        </Text>
      </View>

      {/* 🟢 Subtitle: % of Daily Intake */}
      <Text style={styles.subtitle}>
        <Text style={styles.boldSubtitle}>{percentage.toFixed(1)}%</Text> of recommended daily intake
      </Text>

      {/* 🟢 The Visual Slider */}
      <View style={styles.sliderWrapper}>
        
        {/* The Pointer (Arrow) */}
        <View style={[styles.pointerContainer, { left: `${pointerPosition}%` }]}>
          <Text style={styles.pointerValue}>{value}</Text>
          <FontAwesome5 name="caret-down" size={22} color="#64748b" style={styles.pointerArrow} />
        </View>

        {/* The 5-Color Progress Bar */}
        <View style={styles.barContainer}>
          <View style={[styles.segment, { backgroundColor: '#16a34a', borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]} />
          <View style={[styles.segment, { backgroundColor: '#84cc16' }]} />
          <View style={[styles.segment, { backgroundColor: '#facc15' }]} />
          <View style={[styles.segment, { backgroundColor: '#f97316' }]} />
          <View style={[styles.segment, { backgroundColor: '#ef4444', borderTopRightRadius: 10, borderBottomRightRadius: 10 }]} />
        </View>

        {/* Scale Labels below the bar */}
        <View style={styles.labelsRow}>
          {scaleLabels.map((label, index) => (
            <Text key={index} style={styles.labelText}>{label}</Text>
          ))}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 25, // Space for the pointer
    paddingLeft: 30,
  },
  boldSubtitle: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  sliderWrapper: {
    position: 'relative',
    marginTop: 10,
  },
  pointerContainer: {
    position: 'absolute',
    top: -28, // Positioned right above the bar
    alignItems: 'center',
    transform: [{ translateX: -10 }], // Center the arrow precisely
    zIndex: 10,
  },
  pointerValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: -5,
  },
  pointerArrow: {
    marginTop: -2,
  },
  barContainer: {
    flexDirection: 'row',
    height: 12,
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: 'white', // Gives that separated block look
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  labelText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  }
});