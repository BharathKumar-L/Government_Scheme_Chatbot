/**
 * Voice Service - Handles voice input and output
 * Uses Web Speech API for speech recognition and text-to-speech
 */

// Check browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

export const voiceService = {
  // Check if browser supports speech recognition
  isRecognitionSupported: () => !!SpeechRecognition,

  // Check if browser supports speech synthesis
  isSynthesisSupported: () => !!window.speechSynthesis,

  // Speech to text
  startListening: (options = {}) => {
    return new Promise((resolve, reject) => {
      if (!SpeechRecognition) {
        reject(new Error('Speech Recognition not supported in this browser'));
        return;
      }

      const recognition = new SpeechRecognition();

      // Language - map our languages to WebAPI format
      const languageMap = {
        en: 'en-US',
        hi: 'hi-IN',
        ta: 'ta-IN'
      };

      recognition.language = languageMap[options.language] || 'en-US';
      recognition.continuous = options.continuous || false;
      recognition.interimResults = options.interimResults !== false;

      let finalTranscript = '';
      let interimTranscript = '';

      recognition.onstart = () => {
        console.log('Voice listening started');
        if (options.onStart) options.onStart();
      };

      recognition.onresult = (event) => {
        interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (options.onResult) {
          options.onResult({
            transcript: interimTranscript || finalTranscript,
            isFinal: event.results[event.results.length - 1].isFinal
          });
        }

        if (event.results[event.results.length - 1].isFinal) {
          resolve(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (options.onError) options.onError(event.error);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        console.log('Voice listening ended');
        if (options.onEnd) options.onEnd();
      };

      recognition.start();

      // Return recognition object to allow stopping
      if (options.onRecognitionReady) {
        options.onRecognitionReady(recognition);
      }
    });
  },

  // Stop listening
  stopListening: (recognition) => {
    if (recognition && recognition.abort) {
      recognition.abort();
    }
  },

  // Text to speech
  speak: (text, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech Synthesis not supported in this browser'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Language mapping
      const languageMap = {
        en: 'en-US',
        hi: 'hi-IN',
        ta: 'ta-IN'
      };

      utterance.lang = languageMap[options.language] || 'en-US';
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume !== undefined ? options.volume : 1;

      utterance.onstart = () => {
        console.log('Speech synthesis started');
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        console.log('Speech synthesis ended');
        resolve();
        if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
        if (options.onError) options.onError(event.error);
      };

      utterance.onpause = () => {
        if (options.onPause) options.onPause();
      };

      utterance.onresume = () => {
        if (options.onResume) options.onResume();
      };

      window.speechSynthesis.speak(utterance);
    });
  },

  // Stop speech
  stopSpeaking: () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  },

  // Pause speech
  pauseSpeech: () => {
    if (window.speechSynthesis && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  },

  // Resume speech
  resumeSpeech: () => {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  },

  // Get available voices
  getAvailableVoices: () => {
    if (!window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  },

  // Set voice
  setVoice: (voiceIndex) => {
    const voices = window.speechSynthesis.getVoices();
    return voices[voiceIndex] || voices[0];
  },

  // Check if currently speaking
  isSpeaking: () => {
    return window.speechSynthesis && window.speechSynthesis.speaking;
  }
};

export default voiceService;
