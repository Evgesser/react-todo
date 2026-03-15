// Temporary ambient declarations for internal `natural` package modules used by the classifier API.
// These are internal paths and do not have official type definitions.

declare module 'natural/lib/natural/classifiers/bayes_classifier' {
  export interface BayesClassifierConstructor {
    new (stemmer: unknown): unknown;
  }
  const BayesClassifier: BayesClassifierConstructor;
  export default BayesClassifier;
}

declare module 'natural/lib/natural/tokenizers/regexp_tokenizer' {
  export interface RegexpTokenizerConstructor {
    new (opts: { pattern: RegExp }): { tokenize: (text: string) => string[] };
  }
  export const RegexpTokenizer: RegexpTokenizerConstructor;
}

declare module 'natural/lib/natural/stemmers/porter_stemmer' {
  export interface PorterStemmerClass {
    tokenizeAndStem?: (text: string) => string[];
  }
  const PorterStemmer: PorterStemmerClass;
  export default PorterStemmer;
}
