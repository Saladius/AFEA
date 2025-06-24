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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Filter, MoveHorizontal as MoreHorizontal, Plus, X } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 2; // 24px padding on each side + 16px gap

interface ClothingItem {
  id: string;
  name: string;
  style: string;
  color: string;
  image: string;
  category: string;
  brand?: string;
  size?: string;
  season?: string;
}

const dummyClothes: ClothingItem[] = [
  {
    id: '1',
    name: 'T-shirt blanc',
    style: 'Casual',
    color: 'white',
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Hauts',
    brand: 'Nike',
    size: 'M',
    season: 'Été'
  },
  {
    id: '2',
    name: 'Jean bleu',
    style: 'Casual',
    color: 'blue',
    image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Bas',
    brand: 'Levi\'s',
    size: 'L',
    season: 'Toute saison'
  },
  {
    id: '3',
    name: 'Baskets blanches',
    style: 'Sport',
    color: 'white',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Chaussures',
    brand: 'Adidas',
    size: '42',
    season: 'Toute saison'
  },
  {
    id: '4',
    name: 'Montre classique',
    style: 'Formel',
    color: 'black',
    image: 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Accessoires',
    brand: 'Rolex',
    season: 'Toute saison'
  },
  {
    id: '5',
    name: 'Chemise bleue',
    style: 'Formel',
    color: 'blue',
    image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Hauts',
    brand: 'Hugo Boss',
    size: 'L',
    season: 'Automne'
  },
  {
    id: '6',
    name: 'Pantalon noir',
    style: 'Formel',
    color: 'black',
    image: 'https://images.pexels.com/photos/1598508/pexels-photo-1598508.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1',
    category: 'Bas',
    brand: 'Zara',
    size: 'M',
    season: 'Hiver'
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
  { name: 'white', color: '#FFFFFF' },
];

const brands = ['Toutes', 'Nike', 'Adidas', 'Levi\'s', 'Zara', 'Hugo Boss', 'Rolex'];
const sizes = ['Toutes', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '38', '39', '40', '41', '42', '43', '44'];
const seasons = ['Toutes', 'Printemps', 'Été', 'Automne', 'Hiver', 'Toute saison'];
const clothingStyles = ['Tous', 'Casual', 'Formel', 'Sport', 'Chic'];

interface Filters {
  category: string;
  color: string;
  brand: string;
  size: string;
  season: string;
  style: string;
}

export default function WardrobeScreen() {
  const router = useRouter();
  const [clothes, setClothes] = useState<ClothingItem[]>(dummyClothes);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedColor, setSelectedColor] = useState('all');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    category: 'Tous',
    color: 'all',
    brand: 'Toutes',
    size: 'Toutes',
    season: 'Toutes',
    style: 'Tous'
  });

  const filteredClothes = clothes.filter(item => {
    const categoryMatch = selectedCategory === 'Tous' || item.category === selectedCategory;
    const colorMatch = selectedColor === 'all' || item.color === selectedColor;
    const brandMatch = filters.brand === 'Toutes' || item.brand === filters.brand;
    const sizeMatch = filters.size === 'Toutes' || item.size === filters.size;
    const seasonMatch = filters.season === 'Toutes' || item.season === filters.season;
    const styleMatch = filters.style === 'Tous' || item.style === filters.style;
    
    return categoryMatch && colorMatch && brandMatch && sizeMatch && seasonMatch && styleMatch;
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
            setShowOptionsModal(false);
          },
        },
      ]
    );
  };

  const handleEditItem = (item: ClothingItem) => {
    setShowOptionsModal(false);
    // Navigate to edit screen or show edit modal
    console.log('Edit item:', item.name);
  };

  const handleShareItem = (item: ClothingItem) => {
    setShowOptionsModal(false);
    // Implement share functionality
    console.log('Share item:', item.name);
  };

  const handleItemOptions = (item: ClothingItem) => {
    setSelectedItem(item);
    setShowOptionsModal(true);
  };

  const applyFilters = () => {
    setSelectedCategory(filters.category);
    setSelectedColor(filters.color);
    setShowFiltersModal(false);
  };

  const resetFilters = () => {
    const resetFilters = {
      category: 'Tous',
      color: 'all',
      brand: 'Toutes',
      size: 'Toutes',
      season: 'Toutes',
      style: 'Tous'
    };
    setFilters(resetFilters);
    setSelectedCategory('Tous');
    setSelectedColor('all');
  };

  const getColorForItem = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      'white': '#FFFFFF',
      'black': '#000000',
      'blue': '#3B82F6',
      'red': '#EF4444',
      'green': '#10B981',
      'yellow': '#F59E0B',
      'purple': '#8B5CF6',
      'pink': '#EC4899',
      'gray': '#6B7280',
      'brown': '#A16207',
      'orange': '#EA580C',
    };
    return colorMap[color.toLowerCase()] || '#8E8E93';
  };

  const renderFilterSection = (title: string, options: string[], selectedValue: string, onSelect: (value: string) => void) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptionsScroll}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterOption,
              selectedValue === option && styles.filterOptionActive
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.filterOptionText,
              selectedValue === option && styles.filterOptionTextActive
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Empty state when no clothes
  if (filteredClothes.length === 0 && clothes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ma garde-robe</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Search size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowFiltersModal(true)}
            >
              <Filter size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Plus size={48} color="#E5E2E1" />
          </View>
          <Text style={styles.emptyTitle}>Votre garde-robe est vide</Text>
          <Text style={styles.emptySubtitle}>
            Commencez à ajouter vos vêtements pour créer votre garde-robe virtuelle
          </Text>
          <TouchableOpacity
            style={styles.addToWardrobeButton}
            onPress={() => router.push('/(tabs)/plus')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addToWardrobeButtonText}>Ajouter à ma garde-robe</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ma garde-robe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Search size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowFiltersModal(true)}
          >
            <Filter size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
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

        {/* Clothing Grid - 2 columns */}
        <View style={styles.clothingGrid}>
          {filteredClothes.map((item) => (
            <View key={item.id} style={[styles.clothingCard, { width: cardWidth }]}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.clothingImage} />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.clothingName}>{item.name}</Text>
                
                <View style={styles.cardFooter}>
                  <View style={styles.styleContainer}>
                    <View style={[
                      styles.colorIndicator,
                      { backgroundColor: getColorForItem(item.color) },
                      item.color === 'white' && styles.whiteColorBorder
                    ]} />
                    <Text style={styles.styleText}>{item.style}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.optionsButton}
                    onPress={() => handleItemOptions(item)}
                  >
                    <MoreHorizontal size={16} color="#8E8E93" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Empty filtered state */}
        {filteredClothes.length === 0 && clothes.length > 0 && (
          <View style={styles.emptyFilteredState}>
            <Text style={styles.emptyFilteredTitle}>Aucun résultat</Text>
            <Text style={styles.emptyFilteredSubtitle}>
              Aucun vêtement ne correspond à vos filtres actuels
            </Text>
            <TouchableOpacity
              style={styles.resetFiltersButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetFiltersButtonText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add some bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Item Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.optionsModal}>
            <Text style={styles.optionsTitle}>
              {selectedItem?.name}
            </Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleEditItem(selectedItem!)}
            >
              <Text style={styles.optionText}>Modifier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleShareItem(selectedItem!)}
            >
              <Text style={styles.optionText}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionItem, styles.deleteOption]}
              onPress={() => handleDeleteItem(selectedItem!)}
            >
              <Text style={[styles.optionText, styles.deleteOptionText]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtres</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFiltersModal(false)}
            >
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {renderFilterSection('Catégorie', categories, filters.category, (value) => 
              setFilters(prev => ({ ...prev, category: value }))
            )}

            {renderFilterSection('Marque', brands, filters.brand, (value) => 
              setFilters(prev => ({ ...prev, brand: value }))
            )}

            {renderFilterSection('Taille', sizes, filters.size, (value) => 
              setFilters(prev => ({ ...prev, size: value }))
            )}

            {renderFilterSection('Saison', seasons, filters.season, (value) => 
              setFilters(prev => ({ ...prev, season: value }))
            )}

            {renderFilterSection('Style', clothingStyles, filters.style, (value) => 
              setFilters(prev => ({ ...prev, style: value }))
            )}

            {/* Color Filter in Modal */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Couleur</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorFilterScroll}>
                {colors.map((colorItem) => (
                  <TouchableOpacity
                    key={colorItem.name}
                    style={[
                      styles.colorFilterChip,
                      { backgroundColor: colorItem.color },
                      colorItem.border && styles.colorChipBorder,
                      filters.color === colorItem.name && styles.colorChipSelected
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, color: colorItem.name }))}
                  >
                    {colorItem.name === 'all' && (
                      <Text style={styles.colorAllText}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
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

  // Clothing Grid - Updated for 2 columns
  clothingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 16,
    justifyContent: 'space-between',
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
    marginBottom: 16,
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
  styleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  whiteColorBorder: {
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  styleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  optionsButton: {
    padding: 4,
    borderRadius: 8,
  },

  // Options Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 20,
    marginHorizontal: 40,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    color: '#EF4444',
  },

  // Empty States
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  addToWardrobeButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addToWardrobeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyFilteredState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyFilteredTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyFilteredSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  resetFiltersButton: {
    backgroundColor: '#EE7518',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resetFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  filterSection: {
    marginVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  filterOptionsScroll: {
    flexGrow: 0,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  filterOptionActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  colorFilterScroll: {
    flexGrow: 0,
  },
  colorFilterChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E2E1',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  resetButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});