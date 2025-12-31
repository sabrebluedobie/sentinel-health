import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useVoiceOutput - Browser-native Speech Synthesis (TTS)
 * 
 * HIPAA-safe: Uses Web Speech API (runs locally in browser, no external API calls)
 * Browser support: All modern browsers
 * 
 * @param {Object} options
 * @param {string} options.lang - Language code (default: 'en-US')
 * @param {number} options.rate - Speech rate 0.1-10 (default: 1.0)
 * @param {number} options.pitch - Voice pitch 0-2 (default: 1.0)
 * @param {number} options.volume - Volume 0-1 (default: 1.0)
 * @param {string} options.voice - Preferred voice name (optional)
 * @returns {Object} Voice output controls and state
 */
export default function useVoiceOutput(options = {}) {
  const {
    lang = 'en-US',
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    voice: preferredVoice = null,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const utteranceRef = useRef(null);

  // Load available voices
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech not supported in this browser.');
      return;
    }

    setIsSupported(true);

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log('[TTS] Loaded voices:', voices.length);
    };

    loadVoices();
    
    // Voices load asynchronously in some browsers
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text, customOptions = {}) => {
    if (!window.speechSynthesis) {
      setError('Speech synthesis not available');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (!text || text.trim() === '') {
      setError('No text provided to speak');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    utterance.lang = customOptions.lang || lang;
    utterance.rate = customOptions.rate || rate;
    utterance.pitch = customOptions.pitch || pitch;
    utterance.volume = customOptions.volume || volume;

    // Select voice
    if (customOptions.voice || preferredVoice) {
      const voiceName = customOptions.voice || preferredVoice;
      const selectedVoice = availableVoices.find(v => 
        v.name === voiceName || v.name.includes(voiceName)
      );
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Auto-select a good voice for the language
      const langVoices = availableVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));
      if (langVoices.length > 0) {
        // Prefer voices that aren't novelty voices
        const naturalVoice = langVoices.find(v => 
          !v.name.toLowerCase().includes('novelty') && 
          !v.name.toLowerCase().includes('bad')
        ) || langVoices[0];
        utterance.voice = naturalVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setError(null);
      console.log('[TTS] Started speaking');
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      console.log('[TTS] Finished speaking');
    };

    utterance.onerror = (event) => {
      console.error('[TTS] Error:', event);
      setError(`Speech error: ${event.error}`);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onpause = () => {
      setIsPaused(true);
      console.log('[TTS] Paused');
    };

    utterance.onresume = () => {
      setIsPaused(false);
      console.log('[TTS] Resumed');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, rate, pitch, volume, preferredVoice, availableVoices]);

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Helper: Speak with calm, supportive tone (slower, gentle)
  const speakCalmly = useCallback((text) => {
    speak(text, {
      rate: 0.9,  // Slightly slower
      pitch: 0.95, // Slightly lower pitch
    });
  }, [speak]);

  // Helper: Speak brief confirmation (faster)
  const speakBriefly = useCallback((text) => {
    speak(text, {
      rate: 1.1,
    });
  }, [speak]);

  return {
    // State
    isSpeaking,
    isPaused,
    availableVoices,
    error,
    isSupported,
    
    // Controls
    speak,
    pause,
    resume,
    stop,
    clearError,
    
    // Helpers
    speakCalmly,   // For instructions, summaries
    speakBriefly,  // For confirmations
  };
}
