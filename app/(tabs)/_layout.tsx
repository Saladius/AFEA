import { Tabs } from 'expo-router';
import { Chrome as Home, Shirt as ShirtIcon, Sparkles, User, Plus } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  
  const icons = {
    index: Home,
    wardrobe: ShirtIcon,
    outfit: Sparkles,
    profile: User,
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const IconComponent = icons[route.name as keyof typeof icons];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Style spécial pour l'onglet du milieu (wardrobe)
        if (route.name === 'wardrobe') {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.centerTab}
            >
              <View style={styles.centerTabButton}>
                <Plus size={28} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
          >
            <View style={[
              styles.tabContent,
              isFocused && styles.tabContentActive
            ]}>
              <IconComponent 
                size={24} 
                color={isFocused ? '#EE7518' : '#9CA3AF'} 
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Garde-robe',
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          title: 'Tenues',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}