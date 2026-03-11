Usage
-----

1) Generate augmented training data from your constants:

```bash
node scripts/generate-training-data.mjs
```

This produces:
- `training_data_augmented.json` — JSON label -> examples (used by the JS classifier)
- `fasttext_full_data.txt` — full dataset in fastText format
- `fasttext_train.txt` / `fasttext_test.txt` — quick train/test split

2) (Optional) Train fastText model with Python

Install fastText (may require build tools on Windows):

```bash
pip install fasttext
# or on some systems: pip install git+https://github.com/facebookresearch/fastText
```

Then run:

```bash
python scripts/train_fasttext.py --train fasttext_train.txt --test fasttext_test.txt --output model.ftz --epoch 50
```

3) Integrate model into the Next.js API

- If you want to keep using the JS classifier, restart the dev server. The API will automatically load `training_data_augmented.json` (if present) and train a more robust Bayes classifier.
- If you trained a fastText model, you can either:
  - Serve it from a small Python microservice that exposes a `/classify` endpoint and call it from the Next API, or
  - Use a Node binding to load the model if available on your platform.

Notes
-----
- Achieving ≥95% accuracy depends on dataset coverage, morphological richness, and typos. The generator adds simple typo variants and n-grams, but you may need to add real product names (from user data) and manual corrections for best results.
- Training fastText on a larger corpus (more examples, wordNgrams=2..3, epoch 50..100) will improve generalization.
