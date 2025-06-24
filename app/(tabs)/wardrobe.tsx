import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MoveVertical as MoreVertical } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 24px padding on each side

interface ClothingItem {
  id: string;
  name: string;
  style: string;
  color: string;
  image: string;
  category: string;
}

const dummyClothes: ClothingItem[] = [
  {
    id: '1',
    name: 'T-shirt blanc',
    style: 'Casual',
    color: 'white',
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Hauts'
  },
  {
    id: '2',
    name: 'Jean bleu',
    style: 'Casual',
    color: 'blue',
    image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Bas'
  },
  {
    id: '3',
    name: 'Baskets blanches',
    style: 'Sport',
    color: 'white',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Chaussures'
  },
  {
    id: '4',
    name: 'Montre classique',
    style: 'Formel',
    color: 'black',
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Accessoires'
  },
  {
    id: '5',
    name: 'Chemise bleue',
    style: 'Formel',
    color: 'blue',
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Hauts'
  },
  {
    id: '6',
    name: 'Pantalon noir',
    style: 'Formel',
    color: 'black',
    image: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Bas'
  }
];

const categories = ['Tous', 'Hauts', 'Bas', 'Chaussures', 'Accessoires'];
const colors = [
  { name: 'all', color: '#FFFFFF', border: true },
  { name: 'black', color: '#000000' },
  { name: 'blue', color: '#3B82F6' },
  { name: 'red', color: '#EF4444' },
  { name: 'green', color: '#10B981' },
  { name: 'yellow', color: '#F59E0B' },
  { name: 'purple', color: '#8B5CF6' },
  { name: 'pink', color: '#EC4899' },
  { name: 'gray', color: '#6B7280' },
];

export default function WardrobeScreen() {
  const [clothes, setClothes] = useState<ClothingItem[]>(dummyClothes);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedColor, setSelectedColor] = useState('all');

  const filteredClothes = clothes.filter(item => {
    const categoryMatch = selectedCategory === 'Tous' || item.category === selectedCategory;
    const colorMatch = selectedColor === 'all' || item.color === selectedColor;
    return categoryMatch && colorMatch;
  });

  const handleDeleteItem = (item: ClothingItem) => {
    Alert.alert(
      'Supprimer l\'article',
      `Êtes-vous sûr de vouloir supprimer "${item.name}" de votre garde-robe ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setClothes(prevClothes => prevClothes.filter(c => c.id !== item.id));
          },
        },
      ]
    );
  };

  const getStyleColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'casual':
        return '#E5E2E1';
      case 'sport':
        return '#E5E2E1';
      case 'formel':
        return '#1C1C1E';
      default:
        return '#E5E2E1';
    }
  };

  const getStyleTextColor = (style: string) => {
    switch (style.toLowerCase()) {
      case 'formel':
        return '#FFFFFF';
      default:
        return '#1C1C1E';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ma garde-robe</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Color Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.colorsScroll}
          contentContainerStyle={styles.colorsContainer}
        >
          {colors.map((colorItem) => (
            <TouchableOpacity
              key={colorItem.name}
              style={[
                styles.colorChip,
                { backgroundColor: colorItem.color },
                colorItem.border && styles.colorChipBorder,
                selectedColor === colorItem.name && styles.colorChipSelected
              ]}
              onPress={() => setSelectedColor(colorItem.name)}
            >
              {colorItem.name === 'all' && (
                <Text style={styles.colorAllText}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addColorButton}>
            <Text style={styles.addColorText}>+</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Clothing Grid */}
        <View style={styles.clothingGrid}>
          {filteredClothes.map((item) => (
            <View key={item.id} style={[styles.clothingCard, { width: cardWidth }]}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.clothingImage} />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.clothingName}>{item.name}</Text>
                
                <View style={styles.cardFooter}>
                  <View style={[
                    styles.styleTag,
                    { backgroundColor: getStyleColor(item.style) }
                  ]}>
                    <Text style={[
                      styles.styleText,
                      { color: getStyleTextColor(item.style) }
                    ]}>
                      {item.style}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={() => handleDeleteItem(item)}
                  >
                    <MoreVertical size={16} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Add some bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  
  // Categories
  categoriesScroll: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 24,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  categoryChipActive: {
    backgroundColor: '#EE7518',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },

  // Colors
  colorsScroll: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
  },
  colorsContainer: {
    paddingHorizontal: 24,
  },
  colorChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorChipBorder: {
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  colorChipSelected: {
    borderWidth: 3,
    borderColor: '#EE7518',
  },
  colorAllText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  addColorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C7A3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addColorText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Clothing Grid
  clothingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  clothingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: cardWidth * 1.2,
    backgroundColor: '#F8F9FA',
  },
  clothingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  clothingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  styleTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  styleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    padding: 4,
  },
  bottomPadding: {
    height: 100,
  },
});