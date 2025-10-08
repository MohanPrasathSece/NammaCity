// Simple STT/TTS helpers using Web Speech APIs
// Note: Browser support varies. We use feature detection and fail gracefully.

export function isSTTSupported() {
  const w = window;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function isTTSSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function startRecognition({ lang = 'en-IN', interimResults = false } = {}) {
  return new Promise((resolve, reject) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return reject(new Error('Speech recognition not supported'));

    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((res) => res[0].transcript)
        .join(' ')
        .trim();
      resolve(transcript);
    };
    recognition.onerror = (e) => reject(new Error(e.error || 'STT error'));
    recognition.onnomatch = () => reject(new Error('No speech detected'));

    try {
      recognition.start();
    } catch (e) {
      reject(new Error('Could not start recognition'));
    }
  });
}

export function speak(text, { lang = 'en-IN', rate = 1, pitch = 1 } = {}) {
  if (!isTTSSupported()) return false;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = pitch;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
  return true;
}

export const LANGUAGE_OPTIONS = [
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'en-IN', label: 'English' },
];
