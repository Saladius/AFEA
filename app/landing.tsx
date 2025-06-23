import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight, Camera, Shirt, Star } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  const welcomeSteps = [
    {
      icon: Camera,
      title: "Ajoutez vos vêtements",
      subtitle: "Prenez en photo ou importez vos vêtements pour créer votre garde-robe virtuelle",
      image: "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1",
      color: "#10B981"
    },
    {
      icon: Sparkles,
      title: "Découvrez la magie de l'IA",
      subtitle: "Notre intelligence artificielle analyse vos goûts et crée des tenues parfaites pour vous",
      image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1",
      color: "#8B5CF6"
    },
    {
      icon: Shirt,
      title: "Créez des looks uniques",
      subtitle: "Explorez de nouvelles combinaisons et exprimez votre style personnel chaque jour",
      image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1",
      color: "#EE7518"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % welcomeSteps.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const currentStepData = welcomeSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <View style={[styles.backgroundGradient, { backgroundColor: currentStepData.color }]} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../public/afea-logo-4.png')} 
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Step Indicators */}
        <View style={styles.stepIndicators}>
          {welcomeSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                index === currentStep && styles.stepDotActive
              ]}
            />
          ))}
        </View>

        {/* Main Visual */}
        <Animated.View 
          style={[
            styles.visualContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.phoneFrame}>
            <Image 
              source={{ uri: currentStepData.image }}
              style={styles.phoneImage}
              resizeMode="cover"
            />
            <View style={styles.phoneOverlay}>
              <View style={[styles.iconBadge, { backgroundColor: currentStepData.color }]}>
                <currentStepData.icon size={24} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Text Content */}
        <Animated.View 
          style={[
            styles.textContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
        </Animated.View>

      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/auth?mode=signup')}
        >
          <Text style={styles.primaryButtonText}>Commencer</Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/auth?mode=signin')}
        >
          <Text style={styles.secondaryButtonText}>Se connecter</Text>
        </TouchableOpacity>

      </View>

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement1,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Sparkles size={20} color="rgba(255, 255, 255, 0.6)" />
        </Animated.View>
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement2,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Star size={16} color="rgba(255, 255, 255, 0.4)" />
        </Animated.View>
        <Animated.View 
          style={[
            styles.floatingElement,
            styles.floatingElement3,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Shirt size={18} color="rgba(255, 255, 255, 0.5)" />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    opacity: 0.1,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 15,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E2E1',
  },
  stepDotActive: {
    backgroundColor: '#EE7518',
    width: 24,
  },

  // Visual
  visualContainer: {
    alignItems: 'center',
    marginBottom: 20,
    flex: 1,
    justifyContent: 'center',
  },
  phoneFrame: {
    width: 200,
    height: 300,
    borderRadius: 25,
    backgroundColor: '#1C1C1E',
    padding: 4,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  phoneImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  phoneOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  // Text Content
  textContent: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },

  // Bottom Actions
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
  },

  // Floating Elements
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  floatingElement: {
    position: 'absolute',
  },
  floatingElement1: {
    top: height * 0.15,
    left: 30,
  },
  floatingElement2: {
    top: height * 0.25,
    right: 40,
  },
  floatingElement3: {
    top: height * 0.45,
    left: 50,
  },
});