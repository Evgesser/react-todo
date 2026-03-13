
import type { NextApiRequest, NextApiResponse } from 'next';
import { categoryKeywords, iconChoices } from '@/constants';


const path = require('path');
const fs = require('fs');

interface BayesClassifier {
  addDocument: (text: string, label: string) => void;
  train: () => void;
  getClassifications: (text: string) => Array<{ label: string; value: number }>;
}
interface NaturalLib {
  BayesClassifier: new (stemmer: UniversalStemmer) => BayesClassifier;
  RegexpTokenizer: new (opts: { pattern: RegExp }) => { tokenize: (text: string) => string[] };
  PorterStemmer: { tokenizeAndStem?: (text: string) => string[] };
}
interface UniversalStemmer {
  stem: (token: string) => string;
  tokenizeAndStem: (text: string) => string[];
}

let natural: NaturalLib | null = null;
try {
  const BayesClassifier = require('natural/lib/natural/classifiers/bayes_classifier');
  const { RegexpTokenizer } = require('natural/lib/natural/tokenizers/regexp_tokenizer');
  const PorterStemmer = require('natural/lib/natural/stemmers/porter_stemmer');
  natural = { BayesClassifier, RegexpTokenizer, PorterStemmer };
} catch (e) {
  console.error('Failed to load natural submodules', e);
}


// Use a tokenizer that handles Cyrillic and Hebrew characters properly
// \p{L} matches any character from any language

const tokenizer = natural ? new natural.RegexpTokenizer({ pattern: /[^\p{L}0-9]+/u }) : null;

const universalStemmer: UniversalStemmer = {
  stem: (token: string) => token.toLowerCase(),
  tokenizeAndStem: (text: string) => tokenizer ? tokenizer.tokenize(text.toLowerCase()) : []
};

if (natural) {
  natural.PorterStemmer.tokenizeAndStem = universalStemmer.tokenizeAndStem;
}

let classifier: BayesClassifier | null = null;

function trainClassifier(): BayesClassifier | null {
  if (!natural || !tokenizer) return null;
  const newClassifier = new natural.BayesClassifier(universalStemmer);
  const trainingPath = path.resolve(process.cwd(), 'training_data_augmented.json');
  let jsonData: Record<string, Set<string>> = {};
  if (fs.existsSync(trainingPath)) {
    try {
      const raw = fs.readFileSync(trainingPath, 'utf8');
      const data = JSON.parse(raw) as Record<string, string[]>;
      Object.entries(data).forEach(([label, examples]) => {
        jsonData[label] = new Set();
        examples.forEach((ex) => {
          if (ex && ex.trim()) {
            const tokens = tokenizer.tokenize(ex.toLowerCase());
            newClassifier.addDocument(tokens.join(' '), label);
            jsonData[label].add(ex.toLowerCase());
          }
        });
      });
    } catch (e) {
      console.error('Failed to load training_data_augmented.json, will use only constants', e);
      jsonData = {};
    }
  }
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
    
    // Check classifier classifications with scores
    const raw = classifier.getClassifications(normalized) || [];
    const classifications = raw.slice(0, 10).map((c: { label: string; value: number }) => ({ label: c.label, value: c.value }));
    
    // Sort and get the best one
    const sorted = [...classifications].sort((a, b) => b.value - a.value);
    const topResult = sorted[0];

    // If the score for the top result is too low, or if the classifier 
    // is just guessing between equally weak options, return 'none'.
    // Bayes classifier values for very small training sets can be deceptive,
    // but usually a value > 0.001 (or similar) is needed for "confidence".
    // Alternatively, if the difference between top 1 and top 2 is negligible.
    let category = topResult?.label || 'none';
    
    // Logic: if we have zero confidence, or it's a default guess
    if (!topResult || topResult.value < 0.0001) {
        category = 'none';
    }

    return res.status(200).json({ category, classifications });
  } catch (e) {
    console.error('Classification error', e);
    return res.status(500).json({ error: 'Classification failed' });
  }
}
