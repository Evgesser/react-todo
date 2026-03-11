Training model (local)
=======================

This project includes scripts to generate training data and train a local classifier.
Training is optional and meant to be run locally.

Quick commands
--------------

1) Generate augmented training data from `src/constants.ts`:

```bash
npm run training:generate
# or
node scripts/generate-training-data.mjs
```

This produces (local files):
- `training_data_augmented.json` — JSON label -> examples (used by the JS classifier)
- `fasttext_full_data.txt` — full dataset in fastText format
- `fasttext_train.txt` / `fasttext_test.txt` — quick train/test split

2) Train scikit-learn model (Python)

```bash
# ensure Python and pip are installed
python -m pip install scikit-learn joblib
python scripts/train_sklearn.py
```

This saves `model_sklearn.joblib` in the project root and prints test metrics.

3) (Optional) Train fastText model instead (requires fastText build tools / C++ compiler on Windows)

```bash
python -m pip install fasttext
python scripts/train_fasttext.py --train fasttext_train.txt --test fasttext_test.txt --output model.ftz --epoch 50
```

Notes
-----
- Do not commit large generated model files to the repository. See `.gitignore` which excludes training artifacts.
- If you want the Node `/api/classify` route to use augmented data on deploy, either commit `training_data_augmented.json` (not recommended) or rely on the JS fallback (`categoryKeywords`) which is always available.
- To remove a previously committed model file from git history (if needed):

```bash
git rm --cached model_sklearn.joblib
git commit -m "Remove local model file from repo"
```

If you'd like, I can add a CI job (GitHub Actions) to run training and publish model artifacts to a storage bucket, or spin up a small Python classification microservice for runtime inference. Let me know which option you prefer.
