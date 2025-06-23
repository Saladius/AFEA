import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ClothingItem } from '@/types/database';
import { Heart, MoveVertical as MoreVertical } from 'lucide-react-native';

interface ClothingCardProps {
  item: ClothingItem;
  viewMode?: 'grid' | 'list';
  onPress?: () => void;
  onFavorite?: () => void;
  onMore?: () => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2; // 24px padding on each side + 24px gap

export default function ClothingCard({ 
  item, 
  viewMode = 'grid',
  onPress,
  onFavorite,
  onMore 
}: ClothingCardProps) {
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

  if (viewMode === 'list') {
    return (
      <TouchableOpacity style={styles.listCard} onPress={onPress}>
        <Image source={{ uri: item.image_url }} style={styles.listImage} />
        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{getTypeLabel(item.type)}</Text>
            <TouchableOpacity onPress={onMore}>
              <MoreVertical size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.listTags}>
            {item.color && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.color}</Text>
              </View>
            )}
            {item.brand && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.brand}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.gridCard, { width: cardWidth }]} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image_url }} style={styles.gridImage} />
        <TouchableOpacity style={styles.favoriteButton} onPress={onFavorite}>
          <Heart size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {getTypeLabel(item.type)}
        </Text>
        {item.color && (
          <Text style={styles.gridSubtitle} numberOfLines={1}>
            {item.color}
          </Text>
        )}
        {item.brand && (
          <Text style={styles.gridBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: cardWidth * 1.2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    padding: 16,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  gridBrand: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '500',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  listImage: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  listContent: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  listTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '500',
  },
});