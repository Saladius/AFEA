interface TwilioVerificationResponse {
  sid: string;
  status: string;
  valid: boolean;
}

interface TwilioVerificationCheckResponse {
  sid: string;
  status: string;
  valid: boolean;
}

class TwilioService {
  private accountSid = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
  private authToken = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
  private serviceSid = process.env.EXPO_PUBLIC_TWILIO_VERIFY_SERVICE_SID;
  private baseUrl = 'https://verify.twilio.com/v2/Services';

  private isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.serviceSid);
  }

  private getAuthHeader(): string {
    const credentials = `${this.accountSid}:${this.authToken}`;
    return `Basic ${btoa(credentials)}`;
  }

  async sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio n\'est pas configuré. Veuillez vérifier vos variables d\'environnement.'
      };
    }

    try {
      console.log('📱 Envoi du code de vérification à:', phoneNumber);

      const response = await fetch(`${this.baseUrl}/${this.serviceSid}/Verifications`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          Channel: 'sms'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erreur Twilio:', errorData);
        return {
          success: false,
          error: 'Impossible d\'envoyer le code de vérification. Vérifiez le numéro de téléphone.'
        };
      }

      const data: TwilioVerificationResponse = await response.json();
      console.log('✅ Code de vérification envoyé:', data.status);

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du code:', error);
      return {
        success: false,
        error: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }

  async verifyCode(phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Twilio n\'est pas configuré. Veuillez vérifier vos variables d\'environnement.'
      };
    }

    try {
      console.log('🔍 Vérification du code pour:', phoneNumber);

      const response = await fetch(`${this.baseUrl}/${this.serviceSid}/VerificationCheck`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          Code: code
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erreur de vérification Twilio:', errorData);
        return {
          success: false,
          error: 'Code de vérification invalide.'
        };
      }

      const data: TwilioVerificationCheckResponse = await response.json();
      console.log('📋 Résultat de la vérification:', data);

      if (data.status === 'approved' && data.valid) {
        console.log('✅ Code vérifié avec succès');
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Code de vérification invalide ou expiré.'
        };
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification:', error);
      return {
        success: false,
        error: 'Erreur réseau. Veuillez réessayer.'
      };
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Nettoie et formate le numéro de téléphone
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Si le numéro commence par 0 (format français), remplace par +33
    if (cleaned.startsWith('0')) {
      cleaned = '33' + cleaned.substring(1);
    }
    
    // Si le numéro ne commence pas par +, ajoute +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Vérifie que le numéro a au moins 10 chiffres
    return cleaned.length >= 10;
  }
}

export const twilioService = new TwilioService();