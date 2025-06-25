import React, { useState, useEffect } from 'react';
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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Filter, MoveVertical as MoreVertical, Plus, X, CreditCard as Edit3, Share, Trash2, Palette } from 'lucide-react-native';
import { useClothes } from '@/hooks/useClothes';
import { useAuth } from '@/hooks/useAuth';
import { ClothingItem } from '@/types/database';

const { width } = Dimensions.get('window');
const cardWidth = (width - 64) / 2; // 24px padding on each side + 16px gap

const categories = ['Tous', 'Hauts', 'Bas', 'Chaussures', 'Accessoires', 'Robes', 'Vestes'];
const colors = [
  { name: 'all', color: '#FFFFFF', border: true, label: 'Toutes' },
  { name: 'black', color: '#000000', label: 'Noir' },
  { name: 'blue', color: '#3B82F6', label: 'Bleu' },
  { name: 'red', color: '#EF4444', label: 'Rouge' },
  { name: 'green', color: '#10B981', label: 'Vert' },
  { name: 'yellow', color: '#F59E0B', label: 'Jaune' },
  { name: 'purple', color: '#8B5CF6', label: 'Violet' },
  { name: 'pink', color: '#EC4899', label: 'Rose' },
  { name: 'gray', color: '#6B7280', label: 'Gris' },
  { name: 'white', color: '#FFFFFF', label: 'Blanc' },
  { name: 'brown', color: '#A16207', label: 'Marron' },
  { name: 'orange', color: '#EA580C', label: 'Orange' },
  { name: 'no-color', color: 'transparent', label: 'Sans couleur', special: true },
];

const brands = ['Toutes', 'Nike', 'Adidas', 'Levi\'s', 'Zara', 'Hugo Boss', 'H&M', 'Uniqlo'];
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
  const { user } = useAuth();
  const { clothes, loading, error, fetchClothes, deleteClothingItem } = useClothes();
  
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedColor, setSelectedColor] = useState('all');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    category: 'Tous',
    color: 'all',
    brand: 'Toutes',
    size: 'Toutes',
    season: 'Toutes',
    style: 'Tous'
  });

  // Map database types to display categories
  const mapTypeToCategory = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'top': 'Hauts',
      'bottom': 'Bas',
      'shoes': 'Chaussures',
      'accessories': 'Accessoires',
      'outerwear': 'Vestes',
      'dress': 'Robes',
      'suit': 'Vestes',
    };
    return typeMap[type] || 'Hauts';
  };

  // Map display category back to database type for filtering
  const mapCategoryToType = (category: string): string[] => {
    const categoryMap: { [key: string]: string[] } = {
      'Tous': ['top', 'bottom', 'shoes', 'accessories', 'outerwear', 'dress', 'suit'],
      'Hauts': ['top'],
      'Bas': ['bottom'],
      'Chaussures': ['shoes'],
      'Accessoires': ['accessories'],
      'Vestes': ['outerwear', 'suit'],
      'Robes': ['dress'],
    };
    return categoryMap[category] || [];
  };

  const filteredClothes = clothes.filter(item => {
    const allowedTypes = mapCategoryToType(selectedCategory);
    const categoryMatch = selectedCategory === 'Tous' || allowedTypes.includes(item.type);
    
    let colorMatch = true;
    if (selectedColor === 'no-color') {
      colorMatch = !item.color || item.color.trim() === '';
    } else if (selectedColor !== 'all') {
      colorMatch = item.color?.toLowerCase() === selectedColor.toLowerCase();
    }
    
    const brandMatch = filters.brand === 'Toutes' || item.brand === filters.brand;
    const sizeMatch = filters.size === 'Toutes' || item.size === filters.size;
    const seasonMatch = filters.season === 'Toutes' || item.season === filters.season?.toLowerCase();
    const styleMatch = filters.style === 'Tous' || item.style === filters.style?.toLowerCase();
    
    return categoryMatch && colorMatch && brandMatch && sizeMatch && seasonMatch && styleMatch;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchClothes();
    } catch (error) {
      console.error('Error refreshing clothes:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteItem = (item: ClothingItem) => {
    Alert.alert(
      'Supprimer l\'article',
      `Êtes-vous sûr de vouloir supprimer cet article de votre garde-robe ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClothingItem(item.id);
              setShowOptionsModal(false);
              Alert.alert('Succès', 'Article supprimé de votre garde-robe.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'article.');
            }
          },
        },
      ]
    );
  };

  const handleEditItem = (item: ClothingItem) => {
    setShowOptionsModal(false);
    // Navigate to edit screen or show edit modal
    console.log('Edit item:', item.id);
    Alert.alert('Modification', 'La modification des articles sera bientôt disponible.');
  };

  const handleShareItem = (item: ClothingItem) => {
    setShowOptionsModal(false);
    // Implement share functionality
    console.log('Share item:', item.id);
    Alert.alert('Partage', 'Le partage sera bientôt disponible.');
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
      'blanc': '#FFFFFF',
      'white': '#FFFFFF',
      'noir': '#000000',
      'black': '#000000',
      'bleu': '#3B82F6',
      'blue': '#3B82F6',
      'rouge': '#EF4444',
      'red': '#EF4444',
      'vert': '#10B981',
      'green': '#10B981',
      'jaune': '#F59E0B',
      'yellow': '#F59E0B',
      'violet': '#8B5CF6',
      'purple': '#8B5CF6',
      'rose': '#EC4899',
      'pink': '#EC4899',
      'gris': '#6B7280',
      'gray': '#6B7280',
      'marron': '#A16207',
      'brown': '#A16207',
      'orange': '#EA580C',
    };
    return colorMap[color?.toLowerCase()] || '#8E8E93';
  };

  const renderColorIndicator = (item: ClothingItem) => {
    if (!item.color || item.color.trim() === '') {
      // No color assigned - show palette icon
      return (
        <View style={styles.noColorIndicator}>
          <Palette size={10} color="#8E8E93" />
        </View>
      );
    } else {
      // Color assigned - show color dot
      return (
        <View style={[
          styles.colorIndicator,
          { backgroundColor: getColorForItem(item.color) },
          (item.color?.toLowerCase() === 'white' || item.color?.toLowerCase() === 'blanc') && styles.whiteColorBorder
        ]} />
      );
    }
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

  // Loading state
  if (loading && clothes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ma garde-robe</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EE7518" />
          <Text style={styles.loadingText}>Chargement de votre garde-robe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && clothes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ma garde-robe</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Erreur de chargement</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchClothes}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state when no clothes
  if (clothes.length === 0) {
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

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {clothes.length} article{clothes.length > 1 ? 's' : ''} dans votre garde-robe
        </Text>
        {filteredClothes.length !== clothes.length && (
          <Text style={styles.filteredStatsText}>
            {filteredClothes.length} affiché{filteredClothes.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EE7518']}
            tintColor="#EE7518"
          />
        }
      >
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
                selectedColor === colorItem.name && styles.colorChipSelected,
                colorItem.special && styles.specialColorChip
              ]}
              onPress={() => setSelectedColor(colorItem.name)}
            >
              {colorItem.name === 'all' && (
                <Text style={styles.colorAllText}>✓</Text>
              )}
              {colorItem.name === 'no-color' && (
                <Palette size={16} color="#8E8E93" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Clothing Grid - 2 columns */}
        <View style={styles.clothingGrid}>
          {filteredClothes.map((item) => (
            <View key={item.id} style={[styles.clothingCard, { width: cardWidth }]}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image_url }} style={styles.clothingImage} />
              </View>
              
              <View style={styles.cardContent}>
                <Text style={styles.clothingName} numberOfLines={1}>
                  {mapTypeToCategory(item.type)}
                </Text>
                
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    {renderColorIndicator(item)}
                    <Text style={styles.detailText} numberOfLines={1}>
                      {item.color || 'Sans couleur'}
                    </Text>
                  </View>
                  
                  {item.brand && (
                    <Text style={styles.brandText} numberOfLines={1}>{item.brand}</Text>
                  )}
                  
                  {item.size && (
                    <Text style={styles.sizeText}>Taille {item.size}</Text>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.optionsButton}
                  onPress={() => handleItemOptions(item)}
                >
                  <MoreVertical size={16} color="#8E8E93" />
                </TouchableOpacity>
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
              {selectedItem ? mapTypeToCategory(selectedItem.type) : 'Article'}
            </Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleEditItem(selectedItem!)}
            >
              <Edit3 size={20} color="#1C1C1E" />
              <Text style={styles.optionText}>Modifier</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => handleShareItem(selectedItem!)}
            >
              <Share size={20} color="#1C1C1E" />
              <Text style={styles.optionText}>Partager</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionItem, styles.deleteOption]}
              onPress={() => handleDeleteItem(selectedItem!)}
            >
              <Trash2 size={20} color="#EF4444" />
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
                      filters.color === colorItem.name && styles.colorChipSelected,
                      colorItem.special && styles.specialColorChip
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, color: colorItem.name }))}
                  >
                    {colorItem.name === 'all' && (
                      <Text style={styles.colorAllText}>✓</Text>
                    )}
                    {colorItem.name === 'no-color' && (
                      <Palette size={16} color="#8E8E93" />
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
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Stats
  statsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  statsText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  filteredStatsText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
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
  specialColorChip: {
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderStyle: 'dashed',
  },
  colorAllText: {
    fontSize: 12,
    color: '#8E8E93',
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
    position: 'relative',
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
    position: 'relative',
  },
  clothingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  noColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E2E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  whiteColorBorder: {
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  detailText: {
    fontSize: 12,
    color: '#8E8E93',
    flex: 1,
  },
  brandText: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '500',
    marginBottom: 2,
  },
  sizeText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  optionsButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#1C1C1E',
    flex: 1,
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