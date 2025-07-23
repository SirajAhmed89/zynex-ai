// Type definitions for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export type VoiceRecognitionEventType = 'result' | 'error' | 'start' | 'end' | 'audiostart' | 'audioend';

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface VoiceRecognitionError {
  error: string;
  message: string;
}

export interface VoiceRecognitionCallbacks {
  onResult?: (result: VoiceRecognitionResult) => void;
  onError?: (error: VoiceRecognitionError) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onAudioStart?: () => void;
  onAudioEnd?: () => void;
}

export interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isSupported = false;
  private isListening = false;
  private callbacks: VoiceRecognitionCallbacks = {};

  constructor() {
    this.checkSupport();
  }

  private checkSupport(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.isSupported = !!SpeechRecognition;
      
      if (this.isSupported) {
        this.recognition = new SpeechRecognition();
      }
    }
  }

  public isRecognitionSupported(): boolean {
    return this.isSupported;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }

  public initialize(callbacks: VoiceRecognitionCallbacks, options: VoiceRecognitionOptions = {}): boolean {
    if (!this.isSupported || !this.recognition) {
      console.warn('Speech recognition is not supported in this browser');
      return false;
    }

    this.callbacks = callbacks;

    // Configure recognition settings for continuous recording
    this.recognition.continuous = options.continuous ?? true; // Enable continuous recording
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.lang = options.language ?? 'en-US';
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;
    
    // Additional settings for better performance
    // Note: grammars property is deprecated and not needed for modern speech recognition

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.callbacks.onEnd?.();
    };

    this.recognition.onaudiostart = () => {
      this.callbacks.onAudioStart?.();
    };

    this.recognition.onaudioend = () => {
      this.callbacks.onAudioEnd?.();
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        const isFinal = result.isFinal;

        this.callbacks.onResult?.({
          transcript,
          confidence,
          isFinal
        });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessages: { [key: string]: string } = {
        'no-speech': 'No speech detected. Continue speaking...',
        'audio-capture': 'Audio capture failed. Please check your microphone.',
        'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
        'network': 'Network error occurred. Please check your connection.',
        'aborted': 'Speech recognition was stopped.',
        'bad-grammar': 'Speech recognition grammar error.',
        'language-not-supported': 'The specified language is not supported.',
        'service-not-allowed': 'Speech recognition service not allowed.'
      };

      const message = errorMessages[event.error] || `Unknown speech recognition error: ${event.error}`;
      
      // Only trigger error callback for serious errors, not 'no-speech'
      if (event.error !== 'no-speech') {
        this.callbacks.onError?.({
          error: event.error,
          message
        });
      } else {
        // For 'no-speech' errors, just continue listening if in continuous mode
        console.log('No speech detected, continuing to listen...');
      }
    };

    return true;
  }

  public startListening(): boolean {
    if (!this.isSupported || !this.recognition) {
      console.warn('Speech recognition is not supported');
      return false;
    }

    if (this.isListening) {
      console.warn('Speech recognition is already active');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public abortListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  public getSupportedLanguages(): string[] {
    // Common languages supported by most browsers
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-NZ', 'en-ZA',
      'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-PE', 'es-VE',
      'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH',
      'de-DE', 'de-AT', 'de-CH',
      'it-IT', 'it-CH',
      'pt-BR', 'pt-PT',
      'ru-RU',
      'ja-JP',
      'ko-KR',
      'zh-CN', 'zh-TW', 'zh-HK',
      'ar-SA', 'ar-EG',
      'hi-IN',
      'th-TH',
      'tr-TR',
      'pl-PL',
      'nl-NL', 'nl-BE',
      'sv-SE',
      'da-DK',
      'no-NO',
      'fi-FI'
    ];
  }

  public cleanup(): void {
    if (this.recognition) {
      this.stopListening();
      this.recognition = null;
    }
    this.callbacks = {};
    this.isListening = false;
  }
}

// Singleton instance
let voiceRecognitionService: VoiceRecognitionService | null = null;

export function getVoiceRecognitionService(): VoiceRecognitionService {
  if (!voiceRecognitionService) {
    voiceRecognitionService = new VoiceRecognitionService();
  }
  return voiceRecognitionService;
}

