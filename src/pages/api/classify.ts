
import type { NextApiRequest, NextApiResponse } from 'next';
import { categoryKeywords, iconChoices } from '@/constants';
import * as natural from 'natural';
import fs from 'fs';
import path from 'path';

// Use a tokenizer that handles Cyrillic and Hebrew characters properly
// \p{L} matches any character from any language
const tokenizer = new natural.RegexpTokenizer({ pattern: /[^\p{L}0-9]+/u });

// Create a custom stemmer that doesn't filter out non-Latin characters
const universalStemmer = {
  stem: (token: string) => token.toLowerCase(),
  tokenizeAndStem: (text: string) => tokenizer.tokenize(text.toLowerCase())
};

// Use the stemmer globally for the natural library if possible, 
// though passing it to the constructor is more reliable.
(natural.PorterStemmer as any).tokenizeAndStem = universalStemmer.tokenizeAndStem;

// We'll use a BayesClassifier which is similar in spirit to what fastText uses for simple tasks
// It's pure JS and handles keywords well.
let classifier: natural.BayesClassifier | null = null;

function trainClassifier() {
  // Pass the custom stemmer to avoid filtering out Cyrillic/Hebrew
  const newClassifier = new natural.BayesClassifier(universalStemmer as any);
  const trainingPath = path.resolve(process.cwd(), 'training_data_augmented.json');

  // Prefer augmented training data if present
  if (fs.existsSync(trainingPath)) {
    try {
      const raw = fs.readFileSync(trainingPath, 'utf8');
      const data = JSON.parse(raw) as Record<string, string[]>;
      Object.entries(data).forEach(([label, examples]) => {
        examples.forEach((ex) => {
          if (ex && ex.trim()) {
            const tokens = tokenizer.tokenize(ex.toLowerCase());
            if (tokens.length > 0) newClassifier.addDocument(tokens.join(' '), label);
          }
        });
      });
      newClassifier.train();
      return newClassifier;
    } catch (e) {
      // fall back to constants if JSON fails
      console.error('Failed to load training_data_augmented.json, falling back to constants', e);
    }
  }

  // Fallback: Train from our constants.ts data
  Object.entries(categoryKeywords).forEach(([lang, categories]) => {
    Object.entries(categories).forEach(([label, keywords]) => {
      keywords.forEach((keyword: string) => {
        const tokens = tokenizer.tokenize(keyword.toLowerCase());
        if (tokens.length > 0) newClassifier.addDocument(tokens.join(' '), label);
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

  // Lazy initialization/training
  if (!classifier) {
    classifier = trainClassifier();
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
