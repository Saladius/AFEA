import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useClothes } from '@/hooks/useClothes';
import { useRouter } from 'expo-router';
import { User, Settings, LogOut, Shirt, TrendingUp, Calendar, ChevronRight, Crown, Award, Target, Bell, CircleHelp as HelpCircle, Shield } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { clothes } = useClothes();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      console.log('🔄 User initiated logout');
      
      // Direct logout without confirmation for better UX
      console.log('🔄 Calling signOut...');
      await signOut();
      console.log('✅ Logout successful, redirection will be handled by _layout.tsx');
      
      // Force immediate redirect as backup
      setTimeout(() => {
        router.replace('/auth');
      }, 100);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion.');
      
      // Force redirect even on error
      router.replace('/auth');
    }
  };

  const stats = [
    { label: 'Articles', value: clothes.length, icon: Shirt, color: '#EE7518' },
    { label: 'Tenues créées', value: '24', icon: TrendingUp, color: '#10B981' },
    { label: 'Jours actifs', value: '12', icon: Calendar, color: '#3B82F6' },
  ];

  const menuItems = [
    { 
      section: 'Compte',
      items: [
        { label: 'Paramètres du compte', icon: Settings, onPress: () => {} },
        { label: 'Notifications', icon: Bell, onPress: () => {} },
        { label: 'Confidentialité', icon: Shield, onPress: () => {} },
      ]
    },
    { 
      section: 'Support',
      items: [
        { label: 'Centre d\'aide', icon: HelpCircle, onPress: () => {} },
        { label: 'Nous contacter', icon: User, onPress: () => {} },
      ]
    },
    { 
      section: 'Autres',
      items: [
        { label: 'Se déconnecter', icon: LogOut, onPress: handleSignOut, danger: true },
      ]
    },
  ];

  const achievements = [
    { title: 'Premier pas', description: 'Première connexion', icon: Target, unlocked: true },
    { title: 'Collectionneur', description: '10 articles ajoutés', icon: Award, unlocked: clothes.length >= 10 },
    { title: 'Styliste', description: '50 tenues créées', icon: Crown, unlocked: false },
  ];

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👤 Mon profil</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={32} color="#FFFFFF" />
            </View>
            <View style={styles.premiumBadge}>
              <Crown size={16} color="#FFD700" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {user.user_metadata?.full_name || 'Passionné de mode'}
            </Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.membershipInfo}>
              <Text style={styles.membershipText}>Membre Premium</Text>
              <Text style={styles.membershipDate}>Depuis janvier 2025</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <stat.icon size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Réalisations</Text>
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement, index) => (
              <View 
                key={index} 
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementLocked
                ]}
              >
                <View style={[
                  styles.achievementIcon,
                  { backgroundColor: achievement.unlocked ? '#EE7518' : '#E5E2E1' }
                ]}>
                  <achievement.icon 
                    size={20} 
                    color={achievement.unlocked ? '#FFFFFF' : '#8E8E93'} 
                  />
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[
                    styles.achievementTitle,
                    !achievement.unlocked && styles.achievementTitleLocked
                  ]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementBadgeText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[
                      styles.menuItemIcon,
                      { backgroundColor: item.danger ? '#FEF2F2' : '#F8F9FA' }
                    ]}>
                      <item.icon
                        size={18}
                        color={item.danger ? '#EF4444' : '#8E8E93'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.menuItemText,
                        item.danger && styles.menuItemTextDanger,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <ChevronRight
                    size={16}
                    color={item.danger ? '#EF4444' : '#C7C7CC'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Afea v1.0.0</Text>
          <Text style={styles.appInfoText}>© 2025 Afea. Tous droits réservés.</Text>
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
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EE7518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  membershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  membershipText: {
    fontSize: 12,
    color: '#EE7518',
    fontWeight: '600',
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  membershipDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  achievementTitleLocked: {
    color: '#8E8E93',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  menuItemTextDanger: {
    color: '#EF4444',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
});