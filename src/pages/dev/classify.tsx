import * as React from 'react';
import { useState } from 'react';
import { Container, Box, TextField, Button, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { useAppStore } from '@/stores/useAppStore';
import * as locales from '@/locales';

interface Classification {
  label: string;
  value: number;
}
interface ClassificationResult {
  category: string;
  classifications?: Classification[];
  error?: string;
}

export default function DevClassify() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const language = useAppStore((s) => s.language) || 'en';

  const t = locales[language] || locales.en;

  const getLabel = (key: string) => {
    return (t.categoryLabels as Record<string, string>)?.[key] || key;
  };

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: String(e), category: '' });
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Test classifier ({language})</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            label="Input text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button variant="contained" onClick={run} disabled={loading || !text.trim()}>
            Run
          </Button>
        </Box>

        {result && (
          <Box>
            {result.error ? (
              <Typography color="error">{String(result.error)}</Typography>
            ) : (
              <>
                <Typography sx={{ mb: 1 }}>
                  Predicted: <strong>{getLabel(result.category)}</strong> ({result.category})
                </Typography>
                <Typography variant="subtitle2">Top scores:</Typography>
                <List dense>
                  {Array.isArray(result?.classifications) && result.classifications.length ? (
                    result.classifications.map((c: Classification) => (
                      <ListItem key={c.label}>
                        <ListItemText 
                          primary={getLabel(c.label)} 
                          secondary={`${c.label} 4 ${((c.value || 0) * 100).toFixed(1)}%`} 
                        />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem><ListItemText primary="(no scores)"/></ListItem>
                  )}
                </List>
              </>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
