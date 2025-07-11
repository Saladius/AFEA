import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useClothes } from '@/hooks/useClothes';
import { useWeather } from '@/hooks/useWeather';
import { useEvents } from '@/hooks/useEvents';
import { useOutfitGenerator } from '@/hooks/useOutfitGenerator';
import type { ClothingItem } from '@/types/database';
import { 
  Plus, 
  Bell, 
  User, 
  Shirt, 
  Calendar,
  Heart,
  Settings,
  Grid3x3,
  Watch,
  RefreshCw,
  MapPin
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const { clothes } = useClothes();
  const { weather, loading: weatherLoading, refreshWeather } = useWeather();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { events, loading: eventsLoading } = useEvents();

  // --- Outfit suggestions (V1/V2) ---
  const { outfit, loading: outfitLoading, generateOutfit } = useOutfitGenerator();

  useEffect(() => {
    if (!outfit && !outfitLoading) {
      generateOutfit('casual');
    }
  }, [outfit, outfitLoading]);

  // Fonction pour filtrer les événements de la semaine à venir
  function getEventsForUpcomingWeek() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23,59,59,999);
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= today && eventDate <= nextWeek;
    });
  }
  const plannedOutfits = getEventsForUpcomingWeek();

  if (!user) {
    return null;
  }

  const categories = [
    { id: 'dress', label: 'Dress', icon: '👗' },
    { id: 'tshirt', label: 'T-shirt', icon: '👕' },
    { id: 'jeans', label: 'Jeans', icon: '👖' },
    { id: 'shoes', label: 'Shoes', icon: '👠' },
    { id: 'all', label: 'All', icon: Grid3x3 },
  ];



  const suggestions: ClothingItem[] = (outfit?.clothes || []);



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../public/afea-logo-1.png')} 
              style={styles.logo}
              resizeMode="cover"
            />
            <Text style={styles.logoText}>AFEA</Text>
          </View>
          <View style={styles.headerActions}>
            <Text style={styles.headerTitle}>Home</Text>
            <TouchableOpacity style={styles.headerButton}>
              <Bell size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <User size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.label && styles.categoryCardActive
                ]}
                onPress={() => setSelectedCategory(category.label)}
              >
                <View style={[
                  styles.categoryIcon,
                  selectedCategory === category.label && styles.categoryIconActive
                ]}>
                  {typeof category.icon === 'string' ? (
                    <Text style={styles.categoryEmoji}>{category.icon}</Text>
                  ) : (
                    <category.icon 
                      size={24} 
                      color={selectedCategory === category.label ? '#FFFFFF' : '#8E8E93'} 
                    />
                  )}
                </View>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === category.label && styles.categoryLabelActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Weather Section */}
        <View style={styles.weatherSection}>
          <View style={styles.weatherContainer}>
            <View style={styles.weatherLeft}>
              <Text style={styles.weatherLocation}>
                {weather?.location ?? 'Rabat'}
              </Text>
              <Text style={styles.weatherTemp}>
                {weather?.current.temperature ?? '35'}°
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.forecastContainer}
            >
              {(weather?.forecast || [
                { day: 'Sun', date: '16', high: 27, low: 20, icon: '☀️' },
                { day: 'Mon', date: '17', high: 25, low: 18, icon: '☀️' },
                { day: 'Tue', date: '18', high: 23, low: 16, icon: '☀️' },
                { day: 'Wed', date: '19', high: 26, low: 19, icon: '☀️' },
                { day: 'Thu', date: '20', high: 28, low: 21, icon: '☀️' },
                { day: 'Fri', date: '21', high: 29, low: 22, icon: '☀️' },
                { day: 'Sat', date: '22', high: 31, low: 24, icon: '☀️' },
              ]).slice(0, 7).map((day, index) => (
                <View key={index} style={styles.forecastDay}>
                  <Text style={styles.forecastEmoji}>{day.icon}</Text>
                  <Text style={styles.forecastDayName}>{day.day}</Text>
                  <Text style={styles.forecastDate}>{day.date}</Text>
                  <Text style={styles.forecastTemp}>
                    Hi {day.high}° Lo {day.low}°
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Suggestions */}
        <View style={styles.suggestionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <TouchableOpacity style={styles.reloadButton} onPress={() => generateOutfit('casual')}>
              <RefreshCw size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          <View style={styles.suggestionSubheader}>
            <Text style={styles.suggestionTitle}>Just Right For Today's Weather</Text>
          </View>
          
        {suggestions.length > 0 ? (
          <View style={styles.suggestionsGrid}>
            {suggestions.map((item) => (
              <TouchableOpacity key={item.id} style={styles.suggestionCard}>
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.suggestionImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.noSuggestionsText}>
            Vous n'avez pas encore assez de vêtements pour générer une tenue. Ajoutez-en d'abord dans votre garde-robe.
          </Text>
        )}
          
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{(outfit as any)?.occasion ?? 'Casual'}</Text>
            <TouchableOpacity style={styles.favoriteButton}>
              <Heart size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Plan Your Outfit - Fixed Layout */}
        <View style={styles.planSection}>
          <View style={styles.planHeader}>
            <Text style={styles.sectionTitle}>Plan Your Outfit</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.planGrid}>
            {plannedOutfits.map((event) => {
  // Couleur par défaut (modifiable selon event.event_type si besoin)
  const color = '#EE7518';
  // Format date/heure
  let dateTimeLabel = '';
  try {
    if (event.event_date && event.event_time) {
      dateTimeLabel = new Date(event.event_date + 'T' + event.event_time).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    } else if (event.event_date) {
      dateTimeLabel = new Date(event.event_date).toLocaleDateString('fr-FR', { dateStyle: 'medium' });
    }
  } catch (e) {
    dateTimeLabel = event.event_date || '';
  }
  return (
    <View key={event.id} style={styles.planCard}>
      <View style={[styles.planIcon, { backgroundColor: color }]}> 
        <Calendar size={16} color="#FFFFFF" />
      </View>
      <Text style={styles.planTitle}>{event.title}</Text>
      <Text style={styles.planTime}>{dateTimeLabel}</Text>
      <Text style={styles.planType}>{event.event_type}</Text>
    </View>
  );
})}
            
            <TouchableOpacity 
              style={styles.addPlanCard}
              onPress={() => router.push('/(tabs)/outfit')}
            >
              <Plus size={28} color="#EE7518" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerButton: {
    padding: 4,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Categories
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
    paddingRight: 24,
  },
  categoryCard: {
    alignItems: 'center',
    minWidth: 70,
    marginRight: 16,
  },
  categoryCardActive: {
    // Active state handled by icon and text
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconActive: {
    backgroundColor: '#EE7518',
  },
  categoryEmoji: {
    fontSize: 24,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#1C1C1E',
    fontWeight: '600',
  },

  // Weather
  weatherSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  weatherLeft: {
    minWidth: 80,
  },
  weatherLocation: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  forecastContainer: {
    gap: 16,
    paddingLeft: 8,
  },
  forecastDay: {
    alignItems: 'center',
    minWidth: 60,
  },
  forecastEmoji: {
    fontSize: 14,
    marginBottom: 4,
  },
  forecastDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  forecastDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  forecastTemp: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 12,
  },

  // Suggestions
  suggestionsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  suggestionSubheader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  reloadButton: {
    padding: 4,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  suggestionCard: {
    width: (width - 72) / 2,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    overflow: 'hidden',
  },
  suggestionImage: {
    width: '100%',
    height: '100%',
  },
  categoryTag: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTagText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  favoriteButton: {
    padding: 8,
  },
  noSuggestionsText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Plan Section - Fixed for all cards visible with improved readability
  planSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  planGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  planCard: {
    width: 110,
    height: 110,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  planIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 1,
    lineHeight: 13,
  },
  planTime: {
    fontSize: 9,
    color: '#8E8E93',
    marginBottom: 1,
    lineHeight: 11,
  },
  planType: {
    fontSize: 9,
    color: '#8E8E93',
    lineHeight: 11,
  },
  addPlanCard: {
    width: 110,
    height: 110,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EE7518',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3E2',
  },
});