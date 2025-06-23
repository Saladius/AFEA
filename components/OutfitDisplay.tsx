import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { OutfitSuggestion } from '@/types/database';
import { RefreshCw, Sparkles } from 'lucide-react-native';

interface OutfitDisplayProps {
  outfit: OutfitSuggestion | null;
  loading: boolean;
  onRefresh: () => void;
}

export default function OutfitDisplay({ outfit, loading, onRefresh }: OutfitDisplayProps) {
  if (!outfit || !outfit.clothes) {
    return (
      <View style={styles.emptyContainer}>
        <Sparkles size={48} color="#E5E2E1" />
        <Text style={styles.emptyTitle}>No outfit suggestion</Text>
        <Text style={styles.emptySubtitle}>
          Add some clothes to your wardrobe to get started!
        </Text>
      </View>
    );
  }

  const getTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      top: 'Top',
      bottom: 'Bottom',
      shoes: 'Shoes',
      accessories: 'Accessories',
      outerwear: 'Outerwear',
      dress: 'Dress',
      suit: 'Suit',
    };
    return typeLabels[type] || type;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Perfect Look</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={loading}
        >
          <RefreshCw 
            size={20} 
            color="#EE7518" 
            style={loading ? styles.spinning : undefined} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.outfitScroll}
        contentContainerStyle={styles.outfitContent}
      >
        {outfit.clothes.map((item, index) => (
          <View key={item.id} style={styles.clothingItem}>
            <Image source={{ uri: item.image_url }} style={styles.clothingImage} />
            <View style={styles.clothingInfo}>
              <Text style={styles.clothingType}>{getTypeLabel(item.type)}</Text>
              {item.color && (
                <Text style={styles.clothingDetail}>{item.color}</Text>
              )}
              {item.brand && (
                <Text style={styles.clothingBrand}>{item.brand}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>Styling Tips</Text>
        <View style={styles.tip}>
          <View style={styles.tipDot} />
          <Text style={styles.tipText}>
            Perfect for {outfit.context || 'any occasion'}
          </Text>
        </View>
        <View style={styles.tip}>
          <View style={styles.tipDot} />
          <Text style={styles.tipText}>
            Complete the look with matching accessories
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF3E2',
  },
  spinning: {
    // Add rotation animation if needed
  },
  outfitScroll: {
    marginBottom: 24,
  },
  outfitContent: {
    paddingHorizontal: 4,
  },
  clothingItem: {
    marginRight: 16,
    width: 140,
  },
  clothingImage: {
    width: 140,
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  clothingInfo: {
    alignItems: 'center',
  },
  clothingType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  clothingDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  clothingBrand: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '500',
  },
  suggestions: {
    backgroundColor: '#FEF3E2',
    borderRadius: 16,
    padding: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EE7518',
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    flex: 1,
  },
});