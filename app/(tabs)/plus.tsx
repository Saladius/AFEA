import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AddClothingModal from '@/components/AddClothingModal';

export default function PlusTab() {
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Open modal immediately when this tab is accessed
    setModalVisible(true);
  }, []);

  const handleCloseModal = () => {
    setModalVisible(false);
    // Navigate back to the previous tab (wardrobe)
    router.replace('/(tabs)/wardrobe');
  };

  const handleAddClothing = () => {
    setModalVisible(false);
    // Navigate back to wardrobe after adding clothing
    router.replace('/(tabs)/wardrobe');
  };

  return (
    <View style={styles.container}>
      <AddClothingModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onAdd={handleAddClothing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});