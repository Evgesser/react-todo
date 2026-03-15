import * as React from 'react';

export type SpeechRecognitionResultHandler = (transcript: string) => void;

export function useSpeechRecognition(
  language: string,
  onResult: SpeechRecognitionResultHandler
) {
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    interface WindowWithSpeech extends Window {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    }

    const win = window as unknown as WindowWithSpeech;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    try {
      // Stop any previous instance
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }

    const r = new SR();
    const langMap: Record<string, string> = {
      ru: 'ru-RU',
      he: 'he-IL',
      en: (navigator.language as string) || 'en-US',
    };
    const langCode =
      (language && (langMap[language] || (navigator.language as string) || 'en-US')) ||
      ((navigator.language as string) || 'en-US');

    r.lang = langCode;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onresult = (e: SpeechRecognitionEvent) => {
      const last = e.results[e.results.length - 1];
      const transcript = (last?.[0]?.transcript ?? '').trim();
      if (transcript) onResult(transcript);
    };

    r.onstart = () => setIsListening(true);
    r.onend = () => setIsListening(false);
    r.onerror = () => setIsListening(false);

    recognitionRef.current = r;
    setSupported(true);

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    };
  }, [language, onResult]);

  const start = React.useCallback(() => {
    try {
      recognitionRef.current?.start?.();
    } catch {
      // ignore
    }
  }, []);

  const stop = React.useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
  }, []);

  return { isListening, supported, start, stop };
}
