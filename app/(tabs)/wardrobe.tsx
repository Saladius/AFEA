import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useClothes } from '@/hooks/useClothes';
import { Plus, Grid3x3 as Grid, List, Search, Filter, Shirt } from 'lucide-react-native';
import ClothingCard from '@/components/ClothingCard';
import AddClothingModal from '@/components/AddClothingModal';

const { width } = Dimensions.get('window');

export default function WardrobeScreen() {
  const { user } = useAuth();
  const { clothes, loading } = useClothes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filters = [
    { key: 'all', label: 'Tout', count: clothes.length },
    { key: 'top', label: 'Hauts', count: clothes.filter(c => c.type === 'top').length },
    { key: 'bottom', label: 'Bas', count: clothes.filter(c => c.type === 'bottom').length },
    { key: 'shoes', label: 'Chaussures', count: clothes.filter(c => c.type === 'shoes').length },
    { key: 'accessories', label: 'Accessoires', count: clothes.filter(c => c.type === 'accessories').length },
  ];

  const filteredClothes = selectedFilter === 'all' 
    ? clothes 
    : clothes.filter(item => item.type === selectedFilter);
  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>👕 Ma garde-robe</Text>
            <Text style={styles.subtitle}>
              {clothes.length} {clothes.length <= 1 ? 'article' : 'articles'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#8E8E93" />
            <Text style={styles.searchPlaceholder}>Rechercher dans ma garde-robe...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#EE7518" />
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterChipText,
                selectedFilter === filter.key && styles.filterChipTextActive
              ]}>
                {filter.label} ({filter.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View Mode Toggle */}
        <View style={styles.viewModeSection}>
          <Text style={styles.resultsText}>
            {filteredClothes.length} {filteredClothes.length <= 1 ? 'résultat' : 'résultats'}
          </Text>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'grid' && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode('grid')}
            >
              <Grid size={18} color={viewMode === 'grid' ? '#FFFFFF' : '#8E8E93'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'list' && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode('list')}
            >
              <List size={18} color={viewMode === 'list' ? '#FFFFFF' : '#8E8E93'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {filteredClothes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Shirt size={48} color="#E5E2E1" />
            </View>
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'all' 
                ? 'Aucun article pour le moment' 
                : `Aucun ${filters.find(f => f.key === selectedFilter)?.label.toLowerCase()}`
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? 'Ajoutez votre premier vêtement pour commencer'
                : 'Essayez un autre filtre ou ajoutez de nouveaux articles'
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Ajouter un article</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={viewMode === 'grid' ? styles.grid : styles.list}>
            {filteredClothes.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                viewMode={viewMode}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <AddClothingModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
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
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  addButton: {
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersScroll: {
    marginBottom: 20,
  },
  filtersContent: {
    paddingHorizontal: 24,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E2E1',
  },
  filterChipActive: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  filterChipText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  viewModeSection: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: '#EE7518',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
  },
  list: {
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    padding: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
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
  emptyButton: {
    backgroundColor: '#EE7518',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});