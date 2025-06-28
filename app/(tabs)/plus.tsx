import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';

export default function PlusTab() {
  const [showModal, setShowModal] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ajouter</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.option} onPress={() => setShowModal(true)}>
            <View style={styles.optionIcon}>
              <Plus size={24} color="#EE7518" />
            </View>
            <Text style={styles.optionText}>Ajouter un vêtement</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => setShowModal(true)}>
            <View style={styles.optionIcon}>
              <Plus size={24} color="#EE7518" />
            </View>
            <Text style={styles.optionText}>Créer une tenue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => setShowModal(true)}>
            <View style={styles.optionIcon}>
              <Plus size={24} color="#EE7518" />
            </View>
            <Text style={styles.optionText}>Planifier un événement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fonctionnalité à venir</Text>
            <Text style={styles.modalMessage}>
              Cette fonctionnalité sera bientôt disponible.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingVertical: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E2E1',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#EE7518',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  }
});