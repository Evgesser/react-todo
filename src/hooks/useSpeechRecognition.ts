import * as React from 'react';

export type SpeechRecognitionResultHandler = (transcript: string) => void;

export function useSpeechRecognition(
  language: string,
  onResult: SpeechRecognitionResultHandler,
  autoStopAfterResultMs: number = 1500
) {
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const onResultRef = React.useRef(onResult);
  const [isListening, setIsListening] = React.useState(false);
  const [supported, setSupported] = React.useState(false);
  const silenceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const win = window;
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
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
    (r as SpeechRecognition & { continuous: boolean }).continuous = true;

    r.onresult = (e: SpeechRecognitionEvent) => {
      const last = e.results[e.results.length - 1];
      const transcript = (last?.[0]?.transcript ?? '').trim();
      if (transcript) onResultRef.current(transcript);
      if (autoStopAfterResultMs > 0) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          recognitionRef.current?.stop?.();
        }, autoStopAfterResultMs);
      }
    };

    r.onstart = () => {
      console.log('SpeechRecognition started');
      setIsListening(true);
    };
    r.onend = () => {
      console.log('SpeechRecognition ended');
      setIsListening(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
    r.onerror = (err: Event) => {
      console.error('SpeechRecognition error', err);
      setIsListening(false);
    };

    recognitionRef.current = r;
    setSupported(true);

    return () => {
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };
  }, [language]);

  const start = React.useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start SpeechRecognition', err);
    }
  }, [isListening]);

  const stop = React.useCallback(() => {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      // ignore
    }
  }, []);

  return { isListening, supported, start, stop };
}

