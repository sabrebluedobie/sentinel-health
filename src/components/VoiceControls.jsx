import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from 'lucide-react';

/**
 * VoiceControls - UI component for voice input/output
 * 
 * Displays:
 * - Microphone button (with visual feedback when listening)
 * - Current transcript with interim results
 * - Error messages in calm, supportive tone
 * - Optional speaker button for TTS
 */
export default function VoiceControls({
  // Voice Input (STT)
  voiceInput,
  onTranscriptChange,
  placeholder = "Tap microphone and speak...",
  
  // Voice Output (TTS)
  voiceOutput = null,
  textToSpeak = null,
  
  // UI Options
  showTranscript = true,
  autoApplyTranscript = true,
  className = "",
}) {
  const {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript,
    error: sttError,
    isSupported: isSttSupported,
    startListening,
    stopListening,
    resetTranscript,
    clearError: clearSttError,
  } = voiceInput || {};

  // Apply transcript to parent component
  React.useEffect(() => {
    if (autoApplyTranscript && transcript && onTranscriptChange) {
      onTranscriptChange(transcript);
    }
  }, [transcript, autoApplyTranscript, onTranscriptChange]);

  if (!isSttSupported) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <p className="text-sm text-yellow-800">
          🎤 Voice input isn't available in this browser. Try Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      clearSttError?.();
      startListening();
    }
  };

  const handleReset = () => {
    resetTranscript?.();
    onTranscriptChange?.('');
  };

  const handleSpeakClick = () => {
    if (voiceOutput && textToSpeak) {
      if (voiceOutput.isSpeaking) {
        voiceOutput.stop();
      } else {
        voiceOutput.speakCalmly(textToSpeak);
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls Row */}
      <div className="flex items-center gap-3">
        {/* Microphone Button */}
        <button
          type="button"
          onClick={handleMicClick}
          className={`
            relative flex items-center justify-center w-12 h-12 rounded-full
            transition-all duration-200 shadow-md
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          disabled={!voiceInput}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
          
          {/* Listening indicator pulse */}
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
          )}
        </button>

        {/* Status Text */}
        <div className="flex-1">
          {isListening ? (
            <p className="text-sm font-medium text-gray-900">
              🎤 Listening...
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              {placeholder}
            </p>
          )}
        </div>

        {/* Reset Button */}
        {transcript && (
          <button
            type="button"
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Clear transcript"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}

        {/* Speaker Button (TTS) */}
        {voiceOutput && textToSpeak && (
          <button
            type="button"
            onClick={handleSpeakClick}
            className={`
              p-2 rounded-lg transition-colors
              ${voiceOutput.isSpeaking 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            aria-label={voiceOutput.isSpeaking ? 'Stop speaking' : 'Read aloud'}
          >
            {voiceOutput.isSpeaking ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Transcript Display */}
      {showTranscript && (fullTranscript || isListening) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-800">
            {fullTranscript || (
              <span className="text-gray-400 italic">Waiting for speech...</span>
            )}
          </p>
          {interimTranscript && (
            <p className="text-xs text-blue-600 mt-1 italic">
              {interimTranscript}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {sttError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-red-500 flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-800">{sttError}</p>
              <button
                type="button"
                onClick={clearSttError}
                className="text-xs text-red-600 hover:text-red-700 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {voiceOutput?.error && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-orange-500 flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-orange-800">{voiceOutput.error}</p>
              <button
                type="button"
                onClick={voiceOutput.clearError}
                className="text-xs text-orange-600 hover:text-orange-700 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Tips */}
      {isListening && !sttError && (
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tip:</strong> Speak naturally. Pause between thoughts for better accuracy.</p>
          <p>✋ Click the microphone again when you're done.</p>
        </div>
      )}
    </div>
  );
}
