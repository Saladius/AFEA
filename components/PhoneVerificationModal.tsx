import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { X, Phone, MessageSquare } from 'lucide-react-native';
import { twilioService } from '@/services/twilio';

interface PhoneVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerificationSuccess: (phoneNumber: string) => void;
  phoneNumber: string;
}

const { width } = Dimensions.get('window');

export default function PhoneVerificationModal({
  visible,
  onClose,
  onVerificationSuccess,
  phoneNumber
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState(phoneNumber);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const codeInputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown pour le renvoi du code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!twilioService.validatePhoneNumber(phone)) {
      setError('Veuillez entrer un numéro de téléphone valide');
      return;
    }

    setLoading(true);
    setError('');

    const formattedPhone = twilioService.formatPhoneNumber(phone);
    const result = await twilioService.sendVerificationCode(formattedPhone);

    if (result.success) {
      setPhone(formattedPhone);
      setStep('code');
      setCountdown(60); // 60 secondes avant de pouvoir renvoyer
    } else {
      setError(result.error || 'Erreur lors de l\'envoi du code');
    }

    setLoading(false);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    const result = await twilioService.verifyCode(phone, verificationCode);

    if (result.success) {
      onVerificationSuccess(phone);
      handleClose();
    } else {
      setError(result.error || 'Code de vérification invalide');
    }

    setLoading(false);
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setVerificationCode('');
    setError('');
    setCountdown(0);
    onClose();
  };

  const handleCodeInput = (text: string, index: number) => {
    const newCode = verificationCode.split('');
    newCode[index] = text;
    const updatedCode = newCode.join('');
    setVerificationCode(updatedCode);

    // Auto-focus sur le champ suivant
    if (text && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-vérification quand le code est complet
    if (updatedCode.length === 6) {
      setTimeout(() => handleVerifyCode(), 100);
    }
  };

  const handleBackspace = (index: number) => {
    if (verificationCode[index] === '' && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'phone' ? 'Vérification téléphone' : 'Code de vérification'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {step === 'phone' ? (
            <>
              {/* Étape 1: Saisie du numéro */}
              <View style={styles.iconContainer}>
                <Phone size={48} color="#EE7518" />
              </View>
              
              <Text style={styles.subtitle}>
                Entrez votre numéro de téléphone pour recevoir un code de vérification
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="+33 6 12 34 56 78"
                  placeholderTextColor="#C7C7CC"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Envoyer le code</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Étape 2: Saisie du code */}
              <View style={styles.iconContainer}>
                <MessageSquare size={48} color="#EE7518" />
              </View>
              
              <Text style={styles.subtitle}>
                Entrez le code à 6 chiffres envoyé au {phone}
              </Text>

              <View style={styles.codeContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (codeInputRefs.current[index] = ref)}
                    style={styles.codeInput}
                    value={verificationCode[index] || ''}
                    onChangeText={(text) => handleCodeInput(text, index)}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace') {
                        handleBackspace(index);
                      }
                    }}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                  />
                ))}
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Vérifier</Text>
                )}
              </TouchableOpacity>

              {/* Bouton de renvoi */}
              <TouchableOpacity
                style={[styles.resendButton, countdown > 0 && styles.resendButtonDisabled]}
                onPress={handleSendCode}
                disabled={countdown > 0 || loading}
              >
                <Text style={[styles.resendButtonText, countdown > 0 && styles.resendButtonTextDisabled]}>
                  {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer le code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeNumberButton}
                onPress={() => setStep('phone')}
              >
                <Text style={styles.changeNumberButtonText}>Changer de numéro</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E2E1',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    textAlign: 'center',
    marginRight: 24,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  phoneInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#1C1C1E',
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    marginBottom: 32,
  },
  codeInput: {
    width: 45,
    height: 55,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E2E1',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#EE7518',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    color: '#EE7518',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#8E8E93',
  },
  changeNumberButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  changeNumberButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
});