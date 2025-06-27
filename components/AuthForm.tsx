import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from 'react-native';
import { ArrowLeft, Mail, Lock, EyeOff, Eye, User, Sparkles, Phone, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

const { width, height } = Dimensions.get('window');

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const { signIn, signUp, signInWithGoogle, signUpWithPhone } = useAuth();

  const handleEmailAuth = async () => {
    if (mode === 'signup') {
      if (!fullName || !email || !password) {
        setError('Veuillez remplir tous les champs');
        return;
      }
      if (!agreedToTerms) {
        setError('Veuillez accepter les conditions d\'utilisation');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
    } else {
      if (!email || !password) {
        setError('Veuillez remplir tous les champs');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    try {
      let result;
      if (mode === 'signup') {
        result = await signUp(email, password, fullName);
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        // Handle specific authentication errors with more detailed messages
        if (result.error.message.includes('Invalid login credentials') || 
            result.error.message.includes('invalid_credentials')) {
          if (mode === 'signin') {
            setError('Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte si vous n\'en avez pas.');
          } else {
            setError('Erreur lors de la création du compte. Veuillez réessayer.');
          }
        } else if (result.error.message.includes('Email not confirmed')) {
          setError('Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.');
        } else if (result.error.message.includes('User already registered')) {
          setError('Un compte existe déjà avec cet email. Essayez de vous connecter ou utilisez un autre email.');
        } else if (result.error.message.includes('Password should be at least')) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
        } else if (result.error.message.includes('Unable to validate email address')) {
          setError('Format d\'email invalide. Veuillez vérifier votre adresse email.');
        } else if (result.error.message.includes('Email rate limit exceeded')) {
          setError('Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.');
        } else if (result.error.message.includes('Signup disabled')) {
          setError('Les inscriptions sont temporairement désactivées. Veuillez réessayer plus tard.');
        } else {
          // Generic error message for other cases
          if (mode === 'signin') {
            setError('Erreur de connexion. Vérifiez vos identifiants et votre connexion internet.');
          } else {
            setError('Erreur lors de la création du compte. Veuillez réessayer.');
          }
        }
      } else if (mode === 'signup') {
        Alert.alert(
          'Compte créé !',
          'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
          [{ text: 'OK', onPress: onToggleMode }]
        );
      } else {
        // Connexion réussie, rediriger vers le dashboard
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('❌ Unexpected auth error:', err);
      if (mode === 'signin') {
        setError('Erreur de connexion inattendue. Vérifiez votre connexion internet et réessayez.');
      } else {
        setError('Erreur lors de la création du compte. Vérifiez votre connexion internet et réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    if (mode === 'signup') {
      if (!fullName || !phoneNumber) {
        setError('Veuillez remplir tous les champs');
        return;
      }
      if (!agreedToTerms) {
        setError('Veuillez accepter les conditions d\'utilisation');
        return;
      }
    } else {
      if (!phoneNumber) {
        setError('Veuillez entrer votre numéro de téléphone');
        return;
      }
    }

    setPhoneLoading(true);
    setError('');
    
    try {
      let result;
      if (mode === 'signup') {
        result = await signUpWithPhone(phoneNumber, fullName);
      } else {
        // For sign in, we'll use the existing signInWithPhone method
        result = { data: null, error: { message: 'Connexion par téléphone sera bientôt disponible' } };
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        if (mode === 'signup') {
          Alert.alert(
            'Code de vérification envoyé',
            'Un code de vérification a été envoyé à votre numéro de téléphone. Veuillez le saisir pour continuer.',
            [{ text: 'OK' }]
          );
        } else {
          // Connexion réussie, rediriger vers le dashboard
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      setError('Erreur lors de l\'envoi du code de vérification.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      console.log('🔄 Initiating Google authentication');
      const result = await signInWithGoogle();
      
      if (result.error) {
        console.error('❌ Google auth error:', result.error);
        
        // Provide more specific error messages
        if (result.error.message.includes('popup_closed_by_user')) {
          setError('Connexion annulée. Veuillez réessayer.');
        } else if (result.error.message.includes('access_denied')) {
          setError('Accès refusé. Veuillez autoriser l\'accès à votre compte Google.');
        } else if (result.error.message.includes('network')) {
          setError('Erreur de réseau. Vérifiez votre connexion internet.');
        } else {
          setError('Erreur lors de la connexion avec Google. Veuillez réessayer.');
        }
      } else {
        console.log('✅ Google authentication successful');
        // Note: For OAuth, the redirect will be handled automatically by Supabase
        // The auth state change listener will handle the navigation
      }
    } catch (err) {
      console.error('❌ Unexpected Google auth error:', err);
      setError('Erreur inattendue lors de la connexion avec Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const clearError = () => {
    setError('');
  };

  if (mode === 'signup') {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.heroSection}>
            <View style={styles.logoSection}>
              <View style={styles.logoRow}>
                <TouchableOpacity style={styles.backButton} onPress={onToggleMode}>
                  <ArrowLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.spacer} />
              </View>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../public/afea-logo-4.png')} 
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.heroSubtitle}>Créez votre garde-robe intelligente</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Créer un compte</Text>
              <Text style={styles.formSubtitle}>Commencez votre voyage mode</Text>
            </View>

            {/* Social Auth Buttons */}
            <View style={styles.socialAuthContainer}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleGoogleAuth}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#4285F4" size="small" />
                ) : (
                  <>
                    <View style={styles.googleIcon}>
                      <Text style={styles.googleIconText}>G</Text>
                    </View>
                    <Text style={styles.socialButtonText}>Continuer avec Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.form}>
              {/* Auth Method Toggle for Signup */}
              <View style={styles.authMethodToggle}>
                <TouchableOpacity
                  style={[
                    styles.authMethodButton,
                    authMethod === 'email' && styles.authMethodButtonActive
                  ]}
                  onPress={() => setAuthMethod('email')}
                >
                  <Mail size={16} color={authMethod === 'email' ? '#FFFFFF' : '#8E8E93'} />
                  <Text style={[
                    styles.authMethodText,
                    authMethod === 'email' && styles.authMethodTextActive
                  ]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.authMethodButton,
                    authMethod === 'phone' && styles.authMethodButtonActive
                  ]}
                  onPress={() => setAuthMethod('phone')}
                >
                  <Phone size={16} color={authMethod === 'phone' ? '#FFFFFF' : '#8E8E93'} />
                  <Text style={[
                    styles.authMethodText,
                    authMethod === 'phone' && styles.authMethodTextActive
                  ]}>
                    Téléphone
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom complet</Text>
                <View style={styles.inputContainer}>
                  <User size={20} color="#8E8E93" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Votre nom complet"
                    placeholderTextColor="#C7C7CC"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    onFocus={clearError}
                  />
                </View>
              </View>

              {authMethod === 'email' ? (
                <>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputContainer}>
                      <Mail size={20} color="#8E8E93" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="votre@email.com"
                        placeholderTextColor="#C7C7CC"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={clearError}
                      />
                    </View>
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mot de passe</Text>
                    <View style={styles.inputContainer}>
                      <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.passwordInput]}
                        placeholder="Créer un mot de passe"
                        placeholderTextColor="#C7C7CC"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={clearError}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={20} color="#8E8E93" />
                        ) : (
                          <Eye size={20} color="#8E8E93" />
                        )}
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.passwordHint}>Minimum 8 caractères</Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Phone Input for Signup */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Numéro de téléphone</Text>
                    <View style={styles.inputContainer}>
                      <Phone size={20} color="#8E8E93" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="+33 6 12 34 56 78"
                        placeholderTextColor="#C7C7CC"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={clearError}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  J'accepte les{' '}
                  <Text style={styles.linkText}>Conditions d'utilisation</Text>
                  {' '}et la{' '}
                  <Text style={styles.linkText}>Politique de confidentialité</Text>
                </Text>
              </TouchableOpacity>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorHeader}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.errorTitle}>Erreur</Text>
                  </View>
                  <Text style={styles.errorText}>{error}</Text>
                  {error.includes('Email ou mot de passe incorrect') && (
                    <TouchableOpacity 
                      style={styles.errorAction}
                      onPress={onToggleMode}
                    >
                      <Text style={styles.errorActionText}>Créer un nouveau compte</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, (loading || phoneLoading) && styles.primaryButtonDisabled]}
                onPress={authMethod === 'email' ? handleEmailAuth : handlePhoneAuth}
                disabled={loading || phoneLoading}
              >
                {(loading || phoneLoading) ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {authMethod === 'email' ? 'Créer mon compte' : 'Créer avec téléphone'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Switch Mode */}
              <TouchableOpacity style={styles.switchModeButton} onPress={onToggleMode}>
                <Text style={styles.switchModeText}>
                  Déjà un compte ? <Text style={styles.switchModeLink}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Sign In Mode
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../public/afea-logo-4.png')} 
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.heroSubtitle}>Votre garde-robe intelligente</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Bon retour !</Text>
            <Text style={styles.formSubtitle}>Connectez-vous à votre compte</Text>
          </View>

          {/* Social Auth Buttons */}
          <View style={styles.socialAuthContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleAuth}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <>
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.socialButtonText}>Continuer avec Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Auth Method Toggle */}
          <View style={styles.authMethodToggle}>
            <TouchableOpacity
              style={[
                styles.authMethodButton,
                authMethod === 'email' && styles.authMethodButtonActive
              ]}
              onPress={() => setAuthMethod('email')}
            >
              <Mail size={16} color={authMethod === 'email' ? '#FFFFFF' : '#8E8E93'} />
              <Text style={[
                styles.authMethodText,
                authMethod === 'email' && styles.authMethodTextActive
              ]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.authMethodButton,
                authMethod === 'phone' && styles.authMethodButtonActive
              ]}
              onPress={() => setAuthMethod('phone')}
            >
              <Phone size={16} color={authMethod === 'phone' ? '#FFFFFF' : '#8E8E93'} />
              <Text style={[
                styles.authMethodText,
                authMethod === 'phone' && styles.authMethodTextActive
              ]}>
                Téléphone
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {authMethod === 'email' ? (
              <>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="votre@email.com"
                      placeholderTextColor="#C7C7CC"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={clearError}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="••••••••"
                      placeholderTextColor="#C7C7CC"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={clearError}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#8E8E93" />
                      ) : (
                        <Eye size={20} color="#8E8E93" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Phone Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Numéro de téléphone</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={20} color="#8E8E93" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="+33 6 12 34 56 78"
                      placeholderTextColor="#C7C7CC"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={clearError}
                    />
                  </View>
                </View>
              </>
            )}

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorHeader}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={styles.errorTitle}>Erreur de connexion</Text>
                </View>
                <Text style={styles.errorText}>{error}</Text>
                {error.includes('Email ou mot de passe incorrect') && (
                  <View style={styles.errorActions}>
                    <TouchableOpacity 
                      style={styles.errorAction}
                      onPress={onToggleMode}
                    >
                      <Text style={styles.errorActionText}>Créer un nouveau compte</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.errorAction}
                      onPress={() => Alert.alert('Mot de passe oublié', 'Cette fonctionnalité sera bientôt disponible.')}
                    >
                      <Text style={styles.errorActionText}>Mot de passe oublié ?</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, (loading || phoneLoading) && styles.primaryButtonDisabled]}
              onPress={authMethod === 'email' ? handleEmailAuth : handlePhoneAuth}
              disabled={loading || phoneLoading}
            >
              {(loading || phoneLoading) ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {authMethod === 'email' ? 'Se connecter' : 'Recevoir le code'}
                </Text>
              )}
            </TouchableOpacity>

            {authMethod === 'email' && !error && (
              /* Forgot Password */
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => Alert.alert('Mot de passe oublié', 'Cette fonctionnalité sera bientôt disponible.')}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}

            {/* Switch Mode */}
            <TouchableOpacity style={styles.switchModeButton} onPress={onToggleMode}>
              <Text style={styles.switchModeText}>
                Nouveau sur Afea ? <Text style={styles.switchModeLink}>Créer un compte</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2025 Afea. Tous droits réservés.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EE7518',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Hero Section (Sign In)
  heroSection: {
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 10,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    width: '100%',
  },
  logoRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 25, // Position to align with center of 100px logo (50px from top)
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  spacer: {
    display: 'none', // No longer needed since button is positioned absolutely
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 30,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 1,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.8)',
    textAlign: 'center',
  },

  // Form Card
  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },

  // Social Auth
  socialAuthContainer: {
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  socialButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E2E1',
  },
  dividerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 16,
  },

  // Auth Method Toggle
  authMethodToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  authMethodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  authMethodButtonActive: {
    backgroundColor: '#EE7518',
  },
  authMethodText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  authMethodTextActive: {
    color: '#FFFFFF',
  },

  // Form
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 12,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  passwordHint: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 6,
    marginRight: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#EE7518',
    borderColor: '#EE7518',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  linkText: {
    color: '#EE7518',
    fontWeight: '600',
  },

  // Enhanced Error Styles
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
    marginBottom: 8,
  },
  errorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  errorAction: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorActionText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#EE7518',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#EE7518',
    fontWeight: '600',
  },
  switchModeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchModeText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  switchModeLink: {
    color: '#EE7518',
    fontWeight: '600',
  },

  // Footer
  footer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    paddingVertical: 16,
  },
});