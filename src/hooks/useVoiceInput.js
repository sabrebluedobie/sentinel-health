import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVoiceInput - Browser-native Speech Recognition (STT)
 * 
 * HIPAA-safe: Uses Web Speech API (runs locally in browser, no external API calls)
 * Browser support: Chrome, Edge, Safari 14.1+
 * 
 * @param {Object} options
 * @param {string} options.lang - Language code (default: 'en-US')
 * @param {boolean} options.continuous - Keep listening after pause (default: true)
 * @param {number} options.maxAlternatives - Number of alternative transcripts (default: 1)
 * @returns {Object} Voice input controls and state
 */
export default function useVoiceInput(options = {}) {
  const {
    lang = 'en-US',
    continuous = true,
    maxAlternatives = 1,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = maxAlternatives;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      console.log('[Voice] Started listening');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current.trim());
      }

      setInterimTranscript(interim);
      console.log('[Voice] Interim:', interim);
      console.log('[Voice] Final:', finalTranscriptRef.current);
    };

    recognition.onerror = (event) => {
      console.error('[Voice] Error:', event.error);
      
      // User-friendly error messages
      const errorMessages = {
        'no-speech': 'No speech detected. Try speaking closer to the microphone.',
        'audio-capture': 'Microphone not found. Please check your audio settings.',
        'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
        'network': 'Network error. Speech recognition may not work offline in all browsers.',
        'aborted': 'Speech recognition was stopped.',
      };

      const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      console.log('[Voice] Stopped listening');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, continuous, maxAlternatives]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      // Already started - this is fine, just ignore
      if (err.message.includes('already started')) {
        console.log('[Voice] Already listening');
      } else {
        setError(err.message);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    
    // Controls
    startListening,
    stopListening,
    resetTranscript,
    clearError,
    
    // Combined display (for showing in UI)
    fullTranscript: transcript + (interimTranscript ? ` ${interimTranscript}` : ''),
  };
}
