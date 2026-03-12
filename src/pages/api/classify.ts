
import type { NextApiRequest, NextApiResponse } from 'next';
import { categoryKeywords, iconChoices } from '@/constants';
import path from 'path';
import fs from 'fs';

// Workaround for https://github.com/NaturalNode/natural/issues/630
// Importing specific submodules to avoid loading the sentiment analyzer which triggers 
// a require() of an ESM module (afinn-165) in CommonJS environments (like Vercel).
let natural: any = null;
try {
  // We use require here to stay in CJS mode if that's what natural expects internally,
  // but we only import what we actually use.
  const BayesClassifier = require('natural/lib/natural/classifiers/bayes_classifier');
  // RegexpTokenizer is not a direct export, but a property of the object returned by its file
  const { RegexpTokenizer } = require('natural/lib/natural/tokenizers/regexp_tokenizer');
  const PorterStemmer = require('natural/lib/natural/stemmers/porter_stemmer');
  natural = { BayesClassifier, RegexpTokenizer, PorterStemmer };
} catch (e) {
  console.error('Failed to load natural submodules', e);
}

// Use a tokenizer that handles Cyrillic and Hebrew characters properly
// \p{L} matches any character from any language
const tokenizer = natural ? new natural.RegexpTokenizer({ pattern: /[^\p{L}0-9]+/u }) : null;

// Create a custom stemmer that doesn't filter out non-Latin characters
const universalStemmer = {
  stem: (token: string) => token.toLowerCase(),
  tokenizeAndStem: (text: string) => tokenizer ? tokenizer.tokenize(text.toLowerCase()) : []
};

if (natural) {
  // Use the stemmer globally for the natural library if possible, 
  // though passing it to the constructor is more reliable.
  (natural.PorterStemmer as any).tokenizeAndStem = universalStemmer.tokenizeAndStem;
}

// We'll use a BayesClassifier which is similar in spirit to what fastText uses for simple tasks
// It's pure JS and handles keywords well.
let classifier: any = null;

function trainClassifier() {
  if (!natural) return null;
  // Pass the custom stemmer to avoid filtering out Cyrillic/Hebrew
  const newClassifier = new natural.BayesClassifier(universalStemmer as any);
  const trainingPath = path.resolve(process.cwd(), 'training_data_augmented.json');

  // Объединённое обучение: сначала training_data_augmented.json, затем categoryKeywords (без дубликатов)
  let jsonData: Record<string, Set<string>> = {};
  if (fs.existsSync(trainingPath)) {
    try {
      const raw = fs.readFileSync(trainingPath, 'utf8');
      const data = JSON.parse(raw) as Record<string, string[]>;
      // Сохраняем для проверки дубликатов
      Object.entries(data).forEach(([label, examples]) => {
        jsonData[label] = new Set();
        examples.forEach((ex) => {
          if (ex && ex.trim()) {
            const tokens = tokenizer.tokenize(ex.toLowerCase());
            if (tokens.length > 0) {
              newClassifier.addDocument(tokens.join(' '), label);
              jsonData[label].add(ex.toLowerCase());
            }
          }
        });
      });
    } catch (e) {
      console.error('Failed to load training_data_augmented.json, will use only constants', e);
      jsonData = {};
    }
  }

  // Добавляем ключевые слова из categoryKeywords, если их нет в jsonData
  Object.entries(categoryKeywords).forEach(([lang, categories]) => {
    Object.entries(categories).forEach(([label, keywords]) => {
      keywords.forEach((keyword: string) => {
        const kw = keyword.toLowerCase();
        if (!jsonData[label] || !jsonData[label].has(kw)) {
          const tokens = tokenizer.tokenize(kw);
          if (tokens.length > 0) newClassifier.addDocument(tokens.join(' '), label);
        }
      });
    });
  });

  newClassifier.train();
  return newClassifier;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!natural) {
    return res.status(500).json({ error: 'Natural language processing module not loaded' });
  }

  // Lazy initialization/training
  if (!classifier) {
    classifier = trainClassifier();
  }

  if (!classifier) {
    return res.status(500).json({ error: 'Failed to initialize classifier' });
  }

  try {
    const normalized = text.toLowerCase();
    
    // We already use the universalStemmer in the classifier, 
    // but we can pass the string directly as it will use the stemmer internally.
    const category = classifier.classify(normalized);

    // getClassifications may return array of {label, value}
    let classifications: Array<{ label: string; value: number }> = [];
    try {
      // @ts-ignore
      const raw = classifier.getClassifications(normalized) || [];
      classifications = raw.slice(0, 10).map((c: any) => ({ label: c.label, value: c.value }));
    } catch (e) {
      // ignore
    }

    return res.status(200).json({ category, classifications });
  } catch (e) {
    console.error('Classification error', e);
    return res.status(500).json({ error: 'Classification failed' });
  }
}
