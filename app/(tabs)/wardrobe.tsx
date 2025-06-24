import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
} from 'react-native';
import { Search, MoveVertical as MoreVertical } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 24px padding on each side

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  image: string;
  style: string;
}

const dummyClothes: ClothingItem[] = [
  {
    id: '1',
    name: 'T-shirt blanc',
    category: 'Hauts',
    color: 'white',
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    style: 'Casual'
  },
  {
    id: '2',
    name: 'Jean bleu',
    category: 'Bas',
    color: 'blue',
    image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    style: 'Casual'
  },
  {
    id: '3',
    name: 'Baskets blanches',
    category: 'Chaussures',
    color: 'white',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    style: 'Sport'
  },
  {
    id: '4',
    name: 'Montre classique',
    category: 'Accessoires',
    color: 'black',
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    style: 'Formel'
  },
  {
    id: '5',
    name: 'Chemise rouge',
    category: 'Hauts',
    color: 'red',
    image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    style: 'Casual'
  },
  {
    id: '6',
    name: 'Pantalon noir',
    category: 'Bas',
    color: 'black',
    image: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    style: 'Formel'
  }
];

const categories = ['Tous', 'Hauts', 'Bas', 'Chaussures', 'Accessoires'];

const colors = [
  { name: 'all', color: '#FFFFFF', border: '#E5E2E1' },
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
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedColor, setSelectedColor] = useState('all');

  const filteredClothes = dummyClothes.filter(item => {
    const categoryMatch = selectedCategory === 'Tous' || item.category === selectedCategory;
    const colorMatch = selectedColor === 'all' || item.color === selectedColor;
    return categoryMatch && colorMatch;
  });

  const getStyleColor = (style: string) => {
    switch (style) {
      case 'Casual':
        return '#3B82F6';
      case 'Sport':
        return '#10B981';
      case 'Formel':
        return '#1F2937';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ma garde-robe</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilters}
          contentContainerStyle={styles.categoryFiltersContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.categoryButtonTextActive
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
          style={styles.colorFilters}
          contentContainerStyle={styles.colorFiltersContent}
        >
          {colors.map((colorItem) => (
            <TouchableOpacity
              key={colorItem.name}
              style={[
                styles.colorButton,
                { backgroundColor: colorItem.color },
                colorItem.border && { borderColor: colorItem.border, borderWidth: 1 },
                selectedColor === colorItem.name && styles.colorButtonActive
              ]}
              onPress={() => setSelectedColor(colorItem.name)}
            >
              {colorItem.name === 'all' && (
                <Text style={styles.colorButtonCheck}>✓</Text>
              )}
              {selectedColor === colorItem.name && colorItem.name !== 'all' && (
                <Text style={styles.colorButtonCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          
          {/* Add Color Button */}
          <TouchableOpacity style={styles.addColorButton}>
            <Text style={styles.addColorButtonText}>+</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Clothing Grid */}
        <View style={styles.clothingGrid}>
          {filteredClothes.map((item) => (
            <View key={item.id} style={styles.clothingCard}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.clothingImage} />
              </View>
              
              <View style={styles.clothingInfo}>
                <Text style={styles.clothingName}>{item.name}</Text>
                <View style={styles.styleContainer}>
                  <View style={[
                    styles.styleDot,
                    { backgroundColor: getStyleColor(item.style) }
                  ]} />
                  <Text style={styles.styleText}>{item.style}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.moreButton}>
                <MoreVertical size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add some bottom padding for the floating action button */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  
  // Category Filters
  categoryFilters: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  categoryFiltersContent: {
    paddingHorizontal: 24,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#EE7518',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Color Filters
  colorFilters: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
  },
  colorFiltersContent: {
    paddingHorizontal: 24,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: '#EE7518',
  },
  colorButtonCheck: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addColorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E2E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addColorButtonText: {
    color: '#6B7280',
    fontSize: 20,
    fontWeight: '300',
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
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: cardWidth * 0.8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    marginBottom: 12,
    overflow: 'hidden',
  },
  clothingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  clothingInfo: {
    marginBottom: 8,
  },
  clothingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  styleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  styleText: {
    fontSize: 14,
    color: '#6B7280',
  },
  moreButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EE7518',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '300',
  },
  bottomPadding: {
    height: 120,
  },
});