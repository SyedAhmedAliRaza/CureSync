/**
 * Custom hook for Web Speech API voice recognition with regional language support.
 *
 * Maps CureSync language codes to BCP-47 locales used by the Web Speech API.
 * Returns { isListening, transcript, startListening, stopListening, isSupported }
 */
import { useState, useRef, useCallback, useEffect } from 'react';

// Map CureSync language codes to BCP-47 locales for the Web Speech API
const LANGUAGE_MAP = {
  en: 'en-US',
  ur: 'ur-PK',    // Urdu    - Urdu-Pakistan
  bal: 'ur-PK',   // Balochi - closest supported locale (Urdu-Pakistan)
  sd: 'ur-PK',    // Sindhi  - closest supported locale (Urdu-Pakistan)
  ps: 'ps-AF',    // Pashto  - Pashto-Afghanistan
  pa: 'pa-IN',    // Punjabi - Punjabi-India
};

export default function useVoiceInput(language = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Check browser support
  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognition;

  // Stop any existing recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((onResult) => {
    if (!isSupported) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGE_MAP[language] || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interim += t;
        }
      }
      const current = finalTranscript || interim;
      setTranscript(current);
      if (onResult && finalTranscript) {
        onResult(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.warn('Speech recognition error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isSupported, language]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported,
  };
}
