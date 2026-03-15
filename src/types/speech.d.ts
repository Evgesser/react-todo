/* Minimal type declarations for Web Speech API used in the app.
   We only declare the bits we actually use to avoid pulling in large DOM lib differences.
*/

declare global {
  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence?: number;
  }

  interface SpeechRecognitionResult {
    isFinal?: boolean;
    length: number;
    [index: number]: SpeechRecognitionAlternative;
    item?: (index: number) => SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
    item?: (index: number) => SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex?: number;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((ev: SpeechRecognitionEvent) => void) | null;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort?: () => void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

export {};
