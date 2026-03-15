import * as React from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button } from '@mui/material';
import type { ListType } from '@/types';
import { listTypes } from '@/constants';
import type { TranslationKeys } from '@/locales/ru';

interface ListTypeSelectorProps {
  t: TranslationKeys;
  onSelect: (type: ListType) => void;
}

export default function ListTypeSelector({ t, onSelect }: ListTypeSelectorProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, width: '100%' }}>
      <Typography variant="h6" align="center" sx={{ mb: 0.5, fontWeight: 'bold' }}>
        {t.listTypes.selectTitle}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          width: '100%',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
        }}
      >
        {listTypes.map((lt) => {
          const Icon = lt.icon;
          return (
            <Card key={lt.value} variant="outlined" sx={{ height: 'auto', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 1.5 }}>
                <Box sx={{ fontSize: 32, color: 'primary.main' }}>
                  <Icon fontSize="inherit" />
                </Box>
                <Typography variant="subtitle1" align="center" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                  {t.listTypes[lt.key as keyof typeof t.listTypes]}
                </Typography>
                <Typography variant="caption" align="center" color="text.secondary" sx={{ px: 1 }}>
                  {t.listTypes[`${lt.key}Desc` as keyof typeof t.listTypes]}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', p: 1, pt: 0 }}>
                <Button fullWidth size="small" variant="contained" onClick={() => onSelect(lt.value)}>
                  {t.buttons.create}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
